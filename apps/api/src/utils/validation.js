import { AppError } from "./AppError.js";

export function requireFields(data, fields) {
  const missingFields = fields.filter((field) => {
    const value = data?.[field];

    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    throw new AppError(
      `Campos obrigatorios ausentes: ${missingFields.join(", ")}.`,
      400,
    );
  }
}

export function parseId(value, fieldName = "id") {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`O campo ${fieldName} deve ser um numero inteiro positivo.`, 400);
  }

  return id;
}

export function ensureEnumValue(value, allowedValues, fieldName) {
  if (value !== undefined && !allowedValues.includes(value)) {
    throw new AppError(
      `Valor invalido para ${fieldName}. Valores aceitos: ${allowedValues.join(", ")}.`,
      400,
    );
  }
}

export function ensurePositiveNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    throw new AppError(`O campo ${fieldName} deve ser um numero positivo.`, 400);
  }

  return number;
}

export function ensurePositiveInteger(value, fieldName) {
  const number = ensurePositiveNumber(value, fieldName);

  if (!Number.isInteger(number)) {
    throw new AppError(`O campo ${fieldName} deve ser um numero inteiro positivo.`, 400);
  }

  return number;
}

export function toMoney(value) {
  return Number(value).toFixed(2);
}

// Accepts only http(s) URLs for product images; rejects base64 data URLs.
export function normalizeImagemUrl(value, { fieldName = "imagemUrl" } = {}) {
  if (value === undefined || value === null) {
    return null;
  }

  const url = String(value).trim();

  if (!url) {
    return null;
  }

  if (/^data:/i.test(url)) {
    throw new AppError(
      `${fieldName} nao aceita imagem em base64. Envie uma URL http(s) ou cadastre sem imagem.`,
      400,
    );
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new AppError(`${fieldName} deve ser uma URL http(s) valida.`, 400);
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new AppError(`${fieldName} deve usar o protocolo http ou https.`, 400);
  }

  return url;
}
