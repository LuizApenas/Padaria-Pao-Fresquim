import "dotenv/config";

import { defineConfig, env } from "prisma/config";

// Mantém a configuração do Prisma 7 fora do schema.prisma.
// A CLI passa a ler a conexão por aqui, em vez do bloco datasource com url/directUrl.
export default defineConfig({
  // Localização oficial do schema do projeto.
  schema: "prisma/schema.prisma",
  migrations: {
    // Diretório reservado para migrations futuras.
    path: "prisma/migrations",
  },
  datasource: {
    // Para operações da CLI usamos a conexão direta do banco.
    url: env("DIRECT_URL"),
  },
});
