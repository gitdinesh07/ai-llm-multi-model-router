import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name IN ('users', 'api_keys', 'provider_models', 'user_model_access', 'usage_budgets', 'llm_requests', 'quota_events')
      AND column_name = 'id'
    ORDER BY table_name
  `);
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await prisma.$disconnect();
}
