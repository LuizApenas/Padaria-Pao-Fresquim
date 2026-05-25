import "dotenv/config";

import { defineConfig } from "prisma/config";

// Mantém a configuração do Prisma 7 fora do schema.prisma.
// A CLI passa a ler a conexão por aqui, em vez do bloco datasource com url/directUrl.
//
// Lemos diretamente de process.env (em vez do helper env() do prisma/config)
// porque alguns ambientes (container do EasyPanel via shell interativo) nao
// resolvem o env() corretamente. Preferimos DIRECT_URL (conexao direta ao
// banco, ideal para migrations) e caimos para DATABASE_URL como fallback.
const resolvedUrl =
  process.env.DIRECT_URL ||
  process.env.DATABASE_URL ||
  "";

export default defineConfig({
  // Localização oficial do schema do projeto.
  schema: "prisma/schema.prisma",
  migrations: {
    // Diretório reservado para migrations futuras.
    path: "prisma/migrations",
  },
  datasource: {
    url: resolvedUrl,
  },
});
