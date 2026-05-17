import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaults = [
    ...parseModels("openai", process.env.OPENAI_DEFAULT_MODELS ?? "gpt-4o-mini,gpt-4.1-mini"),
    ...parseModels("ollama", process.env.OLLAMA_DEFAULT_MODELS ?? "codellama:latest,gemma3:1b")
  ];

  for (const item of defaults) {
    await prisma.providerModel.upsert({
      where: { provider_model: { provider: item.provider, model: item.model } },
      create: item,
      update: { enabled: true }
    });
  }
}

function parseModels(provider: string, rawModels: string) {
  return rawModels
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean)
    .map((model) => ({ provider, model }));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
