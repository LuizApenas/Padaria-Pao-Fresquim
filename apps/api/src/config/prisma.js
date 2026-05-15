import dotenv from "dotenv";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: new URL("../../.env", import.meta.url) });

// O adapter usa o driver pg por baixo e conecta no Postgres configurado para a API.
const adapter = new PrismaPg(process.env.DATABASE_URL);

// O PrismaClient e exportado como singleton local para ser reutilizado em toda a API.
export const prisma = new PrismaClient({ adapter });
