import { createApp } from "./app.js";
import { initTelemetry } from "./core/telemetry/init-telemetry.js";
import { env } from "./infra/config/env.js";
import { logger } from "./infra/logging/logger.js";

async function bootstrap() {
  await initTelemetry();
  const app = createApp();

  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "LLM router listening");
  });
}

bootstrap().catch((error) => {
  logger.error({ error }, "Failed to bootstrap service");
  process.exit(1);
});
