import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// O adapter usa o driver pg por baixo e conecta no Postgres/Supabase via string de conexão.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// O PrismaClient é exportado como singleton local para ser reutilizado em toda a API.
export const prisma = new PrismaClient({ adapter });
