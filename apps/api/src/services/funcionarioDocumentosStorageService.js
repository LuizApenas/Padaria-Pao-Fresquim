// apps/api/src/services/funcionarioDocumentosStorageService.js
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { AppError } from "../utils/AppError.js";

const MAX_PDF_BYTES = 10 * 1024 * 1024;

function getSupabaseConfig() {
  return {
    projectUrl: process.env.SUPABASE_PROJECT_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    bucket:
      process.env.SUPABASE_STORAGE_BUCKET_FUNCIONARIOS ??
      process.env.SUPABASE_STORAGE_BUCKET_PRODUTOS ??
      "funcionarios-documentos",
  };
}

function sanitizeFileName(fileName) {
  return String(fileName ?? "documento.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadToSupabase(funcionarioId, fileName, buffer) {
  const { projectUrl, serviceRoleKey, bucket } = getSupabaseConfig();

  if (!projectUrl || !serviceRoleKey) {
    return null;
  }

  const objectPath = `${funcionarioId}/${Date.now()}-${sanitizeFileName(fileName)}`;
  const response = await fetch(`${projectUrl}/storage/v1/object/${bucket}/${objectPath}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/pdf",
      "x-upsert": "false",
    },
    body: buffer,
  });

  if (!response.ok) {
    const details = await response.text();
    console.warn(`Supabase storage upload failed for employee ${funcionarioId}: ${details}`);
    return null;
  }

  return `${projectUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
}

async function uploadToLocalRuntime(funcionarioId, fileName, buffer) {
  const safeName = `${Date.now()}-${sanitizeFileName(fileName)}`;
  const relativeDir = path.join(String(funcionarioId));
  const absoluteDir = path.resolve(process.cwd(), ".runtime", "documentos", relativeDir);

  await mkdir(absoluteDir, { recursive: true });
  await writeFile(path.join(absoluteDir, safeName), buffer);

  return `/api/funcionarios/documentos-arquivo/${funcionarioId}/${safeName}`;
}

export async function uploadFuncionarioPdf(funcionarioId, fileName, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new AppError("Arquivo PDF vazio ou invalido.", 400);
  }

  if (buffer.length > MAX_PDF_BYTES) {
    throw new AppError("PDF maior que 10MB.", 400);
  }

  const supabaseUrl = await uploadToSupabase(funcionarioId, fileName, buffer);

  if (supabaseUrl) {
    return supabaseUrl;
  }

  return uploadToLocalRuntime(funcionarioId, fileName, buffer);
}

export function resolveLocalDocumentoPath(funcionarioId, fileName) {
  const safeName = sanitizeFileName(fileName);

  if (!safeName || safeName.includes("..") || safeName.includes("/") || safeName.includes("\\")) {
    throw new AppError("Nome de arquivo invalido.", 400);
  }

  return path.resolve(process.cwd(), ".runtime", "documentos", String(funcionarioId), safeName);
}
