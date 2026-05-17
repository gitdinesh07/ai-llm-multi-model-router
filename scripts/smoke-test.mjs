import "dotenv/config";

const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
const adminApiKey = process.env.ADMIN_API_KEY;
const defaultOllamaModels = (process.env.OLLAMA_DEFAULT_MODELS ?? "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

if (!adminApiKey) {
  console.error("Missing ADMIN_API_KEY in environment.");
  process.exit(1);
}

const runId = Date.now();
const email = `smoke-${runId}@example.com`;

async function main() {
  logStep(`Health check on ${baseUrl}`);
  await expectJson("GET", "/health");

  logStep("OpenAPI document");
  await expectJson("GET", "/openapi.json");

  logStep("Create smoke-test user");
  const createUser = await expectJson("POST", "/v1/admin/users", {
    headers: adminHeaders(),
    body: {
      email,
      name: "smoke-test",
      tokenLimit: 500,
      isAdmin: false
    }
  });

  const user = createUser.data;
  const userId = user.id;
  const userApiKey = user.apiKey;

  if (!userId || !userApiKey) {
    throw new Error("Create user response did not include id and apiKey.");
  }

  logStep("Issue additional API key");
  await expectJson("POST", `/v1/admin/users/${userId}/keys`, {
    headers: adminHeaders()
  });

  logStep("Discover providers before policy");
  const providersBefore = await expectJson("GET", "/v1/providers", {
    headers: userHeaders(userApiKey)
  });

  const ollama = providersBefore.data.find((entry) => entry.provider === "ollama" && entry.status === "available");
  if (!ollama || ollama.models.length === 0) {
    throw new Error("No available Ollama models were discovered.");
  }

  const registeredOllamaModels = ollama.models
    .map((entry) => entry.name)
    .filter((name) => defaultOllamaModels.includes(name));

  if (registeredOllamaModels.length === 0) {
    throw new Error("No discovered Ollama models matched OLLAMA_DEFAULT_MODELS.");
  }

  const allowedModels = registeredOllamaModels.slice(0, 2).map((model) => ({
    provider: "ollama",
    model
  }));

  logStep(`Grant access to ${allowedModels.map((entry) => entry.model).join(", ")}`);
  await expectJson("PATCH", `/v1/admin/users/${userId}/policy`, {
    headers: adminHeaders(),
    body: {
      allowedModels,
      tokenLimit: 750
    }
  });

  logStep("List allowed models");
  const modelsResponse = await expectJson("GET", "/v1/models", {
    headers: userHeaders(userApiKey)
  });

  if (modelsResponse.data.length === 0) {
    throw new Error("Expected at least one allowed model.");
  }

  logStep("Discover providers after policy");
  const providersAfter = await expectJson("GET", "/v1/providers", {
    headers: userHeaders(userApiKey)
  });

  const accessibleOllamaModels = providersAfter.data
    .find((entry) => entry.provider === "ollama")
    ?.models.filter((entry) => entry.accessible)
    .map((entry) => entry.name) ?? [];

  if (accessibleOllamaModels.length === 0) {
    throw new Error("Expected accessible Ollama models after policy update.");
  }

  const syncModel = accessibleOllamaModels[0];
  const streamModel = accessibleOllamaModels[1] ?? accessibleOllamaModels[0];

  logStep(`Synchronous inference with ${syncModel}`);
  const inference = await expectJson("POST", "/v1/inference", {
    headers: userHeaders(userApiKey),
    body: {
      provider: "ollama",
      model: syncModel,
      messages: [
        { role: "user", content: "Reply with exactly: smoke-ok" }
      ]
    },
    timeoutMs: 30000
  });

  if (!String(inference.content).includes("smoke-ok")) {
    throw new Error(`Unexpected sync inference content: ${inference.content}`);
  }

  logStep(`Streaming inference with ${streamModel}`);
  const streamText = await expectText("POST", "/v1/inference/stream", {
    headers: {
      ...userHeaders(userApiKey),
      accept: "text/event-stream"
    },
    body: {
      provider: "ollama",
      model: streamModel,
      messages: [
        { role: "user", content: "Reply with exactly: smoke-stream-ok" }
      ]
    },
    timeoutMs: 30000
  });

  if (!streamText.includes("smoke-stream-ok") || !streamText.includes("event: done")) {
    throw new Error(`Unexpected stream response: ${streamText}`);
  }

  logStep("Usage summary");
  const usage = await expectJson("GET", "/v1/admin/usage", {
    headers: adminHeaders()
  });

  const userUsageRows = usage.data.filter((entry) => entry.userId === userId);
  if (userUsageRows.length === 0) {
    throw new Error("Expected usage rows for smoke-test user.");
  }

  console.log("");
  console.log("Smoke test passed.");
  console.log(JSON.stringify({
    baseUrl,
    userId,
    email,
    syncModel,
    streamModel,
    usageRows: userUsageRows.length
  }, null, 2));
}

function adminHeaders() {
  return {
    "x-admin-api-key": adminApiKey
  };
}

function userHeaders(apiKey) {
  return {
    "x-api-key": apiKey
  };
}

async function expectJson(method, path, options = {}) {
  const response = await send(method, path, options);
  const json = await response.json();

  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${JSON.stringify(json)}`);
  }

  return json;
}

async function expectText(method, path, options = {}) {
  const response = await send(method, path, options);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${method} ${path} failed with ${response.status}: ${text}`);
  }

  return text;
}

async function send(method, path, options = {}) {
  const headers = new Headers(options.headers ?? {});
  let body;

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const timeoutMs = options.timeoutMs ?? 10000;
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(timeoutMs)
  });
}

function logStep(message) {
  console.log(`\n==> ${message}`);
}

main().catch((error) => {
  console.error("");
  console.error("Smoke test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
