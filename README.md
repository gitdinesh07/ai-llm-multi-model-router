# AI Multi-Model Router

Vendor-independent LLM routing service built with `Node.js`, `TypeScript`, and `Express`.

## Features
- `x-api-key` authentication for client inference calls
- Admin APIs for user provisioning, API key issuance, policy updates, and usage reporting
- Provider adapter layer for `OpenAI` and `Ollama`
- Per-user model allowlists and hard token quotas
- Request logging, Prometheus metrics, OpenTelemetry hooks, and LangSmith tracing
- Synchronous JSON inference and SSE streaming endpoints

## Endpoints
- `POST /v1/inference`
- `POST /v1/inference/stream`
- `GET /v1/providers`
- `GET /v1/models`
- `POST /v1/admin/users`
- `POST /v1/admin/users/:id/keys`
- `PATCH /v1/admin/users/:id/policy`
- `GET /v1/admin/usage`
- `GET /health`
- `GET /metrics`
- `GET /openapi.json`
- `GET /docs`

## Local setup
1. Copy `.env.example` to `.env`
2. Install dependencies with `npm install`
3. Generate Prisma client with `npm run prisma:generate`
4. Run migrations with `npm run prisma:migrate`
5. Seed provider models with `npm run prisma:seed`
6. Start the service with `npm run dev`
7. Open Swagger UI at `http://localhost:3000/docs`
8. Run a live route smoke test with `npm run smoke:test`

## Auth model
- Client apps call inference endpoints with `x-api-key`
- Admin endpoints require `x-admin-api-key`
- API keys are stored hashed and only returned once at creation time

## Example inference request
```bash
curl -X POST http://localhost:3000/v1/inference \
  -H "content-type: application/json" \
  -H "x-api-key: llmr_your_user_key" \
  -d '{
    "provider": "ollama",
    "model": "llama3.2",
    "messages": [
      { "role": "user", "content": "Explain vector databases in one paragraph." }
    ]
  }'
```
