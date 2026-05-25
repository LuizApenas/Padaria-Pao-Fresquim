// apps/api/src/services/produtoImagemStorageService.js
// Upload de imagem de produto para Supabase Storage (bucket SUPABASE_STORAGE_BUCKET_PRODUTOS).
// Aceita data URL (base64) vindo do front e devolve a URL publica.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AppError } from "../utils/AppError.js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function getSupabaseConfig() {
  return {
    projectUrl: process.env.SUPABASE_PROJECT_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket: process.env.SUPABASE_STORAGE_BUCKET_PRODUTOS ?? "produtos",
  };
}

function extensionFromMime(mime) {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

function slugify(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "produto";
}

// Extrai mime + Buffer de um data URL: "data:image/jpeg;base64,/9j/4AAQ...".
export function parseDataUri(dataUri) {
  const match = String(dataUri).match(/^data:([a-z0-9.+/-]+);base64,(.+)$/i);
  if (!match) return null;

  const [, mime, base64] = match;
  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    return null;
  }

  return { mime: mime.toLowerCase(), buffer };
}

async function uploadToSupabase(objectPath, mime, buffer) {
  const { projectUrl, serviceRoleKey, bucket } = getSupabaseConfig();

  if (!projectUrl || !serviceRoleKey) {
    return null;
  }

  const response = await fetch(`${projectUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": mime,
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.warn(`[produto-img] upload Supabase falhou (${response.status}): ${details}`);
    return null;
  }

  return `${projectUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function uploadToLocalRuntime(objectPath, buffer) {
  const absolutePath = path.resolve(process.cwd(), ".runtime", "produtos-imagens", objectPath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  // Caminho relativo servido por outra rota (nao temos rota fallback ainda;
  // priorizamos Supabase. Mantemos local apenas para dev sem storage).
  return `/api/produtos/imagens-local/${objectPath}`;
}

/**
 * Recebe um data URL (base64), valida tamanho/mime e devolve a URL publica
 * do storage. Se nao for data URL, devolve null para o caller decidir.
 */
export async function uploadProdutoImagemBase64(dataUri, { nomeProduto = "" } = {}) {
  const parsed = parseDataUri(dataUri);
  if (!parsed) {
    return null;
  }

  if (!ALLOWED_MIME.has(parsed.mime)) {
    throw new AppError(
      `Imagem em formato nao suportado (${parsed.mime}). Use JPG, PNG, WEBP ou GIF.`,
      400,
    );
  }

  if (parsed.buffer.length === 0) {
    throw new AppError("Imagem do produto esta vazia.", 400);
  }

  if (parsed.buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError(
      `Imagem do produto maior que ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`,
      400,
    );
  }

  const ext = extensionFromMime(parsed.mime);
  const slug = slugify(nomeProduto);
  const objectPath = `${Date.now()}-${slug}.${ext}`;

  const supabaseUrl = await uploadToSupabase(objectPath, parsed.mime, parsed.buffer);
  if (supabaseUrl) {
    return supabaseUrl;
  }

  return uploadToLocalRuntime(objectPath, parsed.buffer);
}
