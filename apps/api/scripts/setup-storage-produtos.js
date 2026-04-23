import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { Client } from "pg";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const envFilePath = path.resolve(currentDir, "../.env");
const sqlFilePath = path.resolve(currentDir, "../sql/setup-storage-produtos.sql");

// Carrega as variáveis locais da API antes de abrir a conexão administrativa.
dotenv.config({ path: envFilePath });

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL ou DATABASE_URL precisa estar definido para configurar o bucket.");
}

const sql = await fs.readFile(sqlFilePath, "utf8");
const client = new Client({ connectionString });

await client.connect();

try {
  // Executa o SQL idempotente que cria o bucket e as políticas necessárias.
  await client.query(sql);

  // Confirma a configuração final retornando apenas os dados relevantes do bucket.
  const result = await client.query(
    `
      select id, name, public, file_size_limit, allowed_mime_types
      from storage.buckets
      where id = 'produtos'
    `,
  );

  console.log(JSON.stringify(result.rows[0], null, 2));
} finally {
  await client.end();
}
