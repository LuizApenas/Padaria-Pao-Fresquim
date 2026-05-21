// apps/api/src/constants/seedDefaults.js
// Single source of truth for seed proprietor contact data (prisma/seed.js).

export const SEED_PROPRIETARIO_EMAIL = "joaquim@paofresquim.com";
export const SEED_PROPRIETARIO_TELEFONE_LOCAL = "11999990001";

// Legacy UI placeholder that must be replaced on first settings load.
export const LEGACY_CHATBOT_OWNER_PHONE_PLACEHOLDER = "5599999999999";

export function normalizePhoneToE164(value = "") {
  const digits = String(value).replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

export const SEED_PROPRIETARIO_OWNER_PHONE_E164 = normalizePhoneToE164(
  SEED_PROPRIETARIO_TELEFONE_LOCAL,
);
