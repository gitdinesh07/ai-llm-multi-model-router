export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "AI Multi-Model Router API",
    version: "0.1.0",
    description: "Vendor-independent LLM router with OpenAI and Ollama adapters."
  },
  servers: [
    { url: "http://localhost:3000" }
  ],
  tags: [
    { name: "Infra" },
    { name: "Inference" },
    { name: "Admin" }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
      AdminApiKeyAuth: { type: "apiKey", in: "header", name: "x-admin-api-key" }
    },
    schemas: {
      ChatMessage: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["system", "user", "assistant"] },
          content: { type: "string" }
        }
      },
      InferenceRequest: {
        type: "object",
        required: ["provider", "model", "messages"],
        properties: {
          provider: { type: "string", example: "ollama" },
          model: { type: "string", example: "llama3.2" },
          messages: {
            type: "array",
            items: { $ref: "#/components/schemas/ChatMessage" }
          },
          temperature: { type: "number", example: 0.4 },
          maxTokens: { type: "integer", example: 256 },
          topP: { type: "number", example: 0.9 },
          metadata: { type: "object", additionalProperties: true }
        }
      },
      Usage: {
        type: "object",
        properties: {
          promptTokens: { type: "integer" },
          completionTokens: { type: "integer" },
          totalTokens: { type: "integer" }
        }
      },
      InferenceResponse: {
        type: "object",
        properties: {
          requestId: { type: "string" },
          traceId: { type: "string" },
          latencyMs: { type: "integer" },
          provider: { type: "string" },
          model: { type: "string" },
          content: { type: "string" },
          finishReason: { type: "string" },
          usage: { $ref: "#/components/schemas/Usage" }
        }
      },
      ProviderCatalogModel: {
        type: "object",
        properties: {
          name: { type: "string" },
          accessible: { type: "boolean" }
        }
      },
      ProviderCatalogEntry: {
        type: "object",
        properties: {
          provider: { type: "string" },
          status: { type: "string", enum: ["available", "unavailable"] },
          models: {
            type: "array",
            items: { $ref: "#/components/schemas/ProviderCatalogModel" }
          },
          error: { type: "string" }
        }
      },
      CreateUserRequest: {
        type: "object",
        required: ["email", "name", "tokenLimit"],
        properties: {
          email: { type: "string", format: "email" },
          name: { type: "string" },
          tokenLimit: { type: "integer", example: 500000 },
          isAdmin: { type: "boolean", default: false }
        }
      },
      CreateUserResponse: {
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          name: { type: "string" },
          status: { type: "string" },
          isAdmin: { type: "boolean" },
          apiKey: { type: "string" },
          keyPrefix: { type: "string" }
        }
      },
      UpdatePolicyRequest: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ACTIVE", "BLOCKED"] },
          tokenLimit: { type: "integer" },
          allowedModels: {
            type: "array",
            items: {
              type: "object",
              required: ["provider", "model"],
              properties: {
                provider: { type: "string" },
                model: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Infra"],
        summary: "Health check",
        responses: { "200": { description: "Service is healthy" } }
      }
    },
    "/metrics": {
      get: {
        tags: ["Infra"],
        summary: "Prometheus metrics",
        responses: { "200": { description: "Prometheus metrics output" } }
      }
    },
    "/v1/models": {
      get: {
        tags: ["Inference"],
        summary: "List models allowed for the caller",
        security: [{ ApiKeyAuth: [] }],
        responses: { "200": { description: "Allowed models list" } }
      }
    },
    "/v1/providers": {
      get: {
        tags: ["Inference"],
        summary: "List providers and their currently discoverable models",
        security: [{ ApiKeyAuth: [] }],
        responses: {
          "200": {
            description: "Provider catalog grouped by vendor",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: "#/components/schemas/ProviderCatalogEntry" }
                    },
                    requestId: { type: "string" },
                    traceId: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/inference": {
      post: {
        tags: ["Inference"],
        summary: "Run synchronous inference",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InferenceRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Normalized inference response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/InferenceResponse" }
              }
            }
          }
        }
      }
    },
    "/v1/inference/stream": {
      post: {
        tags: ["Inference"],
        summary: "Run streaming inference over SSE",
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/InferenceRequest" }
            }
          }
        },
        responses: { "200": { description: "SSE stream response" } }
      }
    },
    "/v1/admin/users": {
      post: {
        tags: ["Admin"],
        summary: "Create a user and issue their API key",
        security: [{ AdminApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "User created with initial API key",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: { $ref: "#/components/schemas/CreateUserResponse" },
                    requestId: { type: "string" },
                    traceId: { type: "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/v1/admin/users/{id}/keys": {
      post: {
        tags: ["Admin"],
        summary: "Issue a user API key",
        security: [{ AdminApiKeyAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: { "201": { description: "API key issued" } }
      }
    },
    "/v1/admin/users/{id}/policy": {
      patch: {
        tags: ["Admin"],
        summary: "Update user access and quota policy",
        security: [{ AdminApiKeyAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdatePolicyRequest" }
            }
          }
        },
        responses: { "200": { description: "User policy updated" } }
      }
    },
    "/v1/admin/usage": {
      get: {
        tags: ["Admin"],
        summary: "Get grouped usage summary",
        security: [{ AdminApiKeyAuth: [] }],
        responses: { "200": { description: "Usage summary" } }
      }
    }
  }
} as const;
