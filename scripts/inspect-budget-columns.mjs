import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'usage_budgets' ORDER BY ordinal_position"
  );
  console.log(JSON.stringify(rows, null, 2));
} finally {
  await prisma.$disconnect();
}
