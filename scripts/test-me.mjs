import "dotenv/config";

const baseUrl = process.env.SMOKE_BASE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`;
const adminApiKey = process.env.ADMIN_API_KEY;

async function main() {
  console.log("==> Create test user for /me test");
  const createRes = await fetch(`${baseUrl}/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-api-key": adminApiKey
    },
    body: JSON.stringify({
      email: `test-me-${Date.now()}@example.com`,
      name: "test-me",
      tokenLimit: 500,
      isAdmin: false
    })
  });
  
  if (!createRes.ok) {
    throw new Error("Failed to create user: " + await createRes.text());
  }
  
  const user = (await createRes.json()).data;
  console.log("User created:", user.id);
  
  console.log("==> Test /v1/me endpoint");
  const meRes = await fetch(`${baseUrl}/v1/me`, {
    headers: {
      "x-api-key": user.apiKey
    }
  });
  
  if (!meRes.ok) {
    throw new Error("Failed to get /me: " + await meRes.text());
  }
  
  const meData = await meRes.json();
  console.log("Success! Response from /v1/me:");
  console.log(JSON.stringify(meData, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
