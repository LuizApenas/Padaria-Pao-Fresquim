// apps/api/scripts/cleanup-documentos-teste.js
// Removes demonstration/test employee documents from the database.
import "dotenv/config";

import { prisma } from "../src/config/prisma.js";

async function main() {
  const deleted = await prisma.atestado.deleteMany({
    where: {
      OR: [
        { arquivoUrl: { contains: "example.com" } },
        { observacao: { contains: "fake", mode: "insensitive" } },
        { observacao: { contains: "demonstracao", mode: "insensitive" } },
        { observacao: { equals: "Teste", mode: "insensitive" } },
      ],
    },
  });

  console.log(JSON.stringify({ documentosRemovidos: deleted.count }, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
