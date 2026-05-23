// apps/api/src/services/chatbotSettingsService.js
// Persiste configuracoes do chatbot (Evolution, toggles de avisos e metricas) em arquivo local.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { prisma } from "../config/prisma.js";
import {
  LEGACY_CHATBOT_OWNER_PHONE_PLACEHOLDER,
  SEED_PROPRIETARIO_EMAIL,
  SEED_PROPRIETARIO_OWNER_PHONE_E164,
  normalizePhoneToE164,
} from "../constants/seedDefaults.js";

// Arquivo JSON local (nao versionado) com credenciais Evolution e flags de negocio.
const SETTINGS_PATH = resolve(process.cwd(), ".runtime", "chatbot-config.json");

// Valores padrao quando o arquivo ainda nao existe.
const DEFAULT_SETTINGS = {
  evolutionApiUrl: "",
  evolutionApiKey: "",
  evolutionDispatchPath: "/message/sendText",
  ownerPhone: SEED_PROPRIETARIO_OWNER_PHONE_E164,
  // Master switch do atendimento WhatsApp. Quando false, o webhook ignora
  // todas as mensagens recebidas (notificacoes outbound seguem funcionando).
  whatsappBotEnabled: true,
  orderReadyNotificationsEnabled: true,
  debtWarningsEnabled: true,
  // Rotina automatica de cobranca: quando ligada, dispara cobranca para todos
  // os clientes com saldo de fiado uma vez por dia no horario configurado.
  debtAutoCronEnabled: false,
  debtAutoCronTime: "09:00",
  dailyMetricsEnabled: true,
  // Debounce do webhook WhatsApp: aguarda N ms apos a ultima mensagem antes de responder.
  messageBufferMs: 2500,
};

function isLegacyOwnerPhonePlaceholder(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  const legacyDigits = LEGACY_CHATBOT_OWNER_PHONE_PLACEHOLDER.replace(/\D/g, "");

  return digits === legacyDigits;
}

// Prefere telefone do proprietario seedado no banco; cai no valor do seed/constants.
async function resolveDefaultOwnerPhone() {
  const envOverride = process.env.CHATBOT_DEFAULT_OWNER_PHONE?.trim();

  if (envOverride) {
    return normalizePhoneToE164(envOverride);
  }

  try {
    const proprietario = await prisma.funcionario.findFirst({
      where: {
        role: "PROPRIETARIO",
        ativo: true,
        email: SEED_PROPRIETARIO_EMAIL,
      },
      select: { telefone: true },
      orderBy: { id: "asc" },
    });

    if (proprietario?.telefone) {
      return normalizePhoneToE164(proprietario.telefone);
    }
  } catch {
    // DB may be unavailable during early startup; keep seed fallback.
  }

  return SEED_PROPRIETARIO_OWNER_PHONE_E164;
}

// Garante tipos corretos e strings vazias em vez de undefined.
function sanitizeSettings(settings) {
  const ownerPhoneRaw = settings.ownerPhone ?? "";
  const ownerPhone = ownerPhoneRaw ? normalizePhoneToE164(ownerPhoneRaw) : "";

  return {
    evolutionApiUrl: settings.evolutionApiUrl ?? "",
    evolutionApiKey: settings.evolutionApiKey ?? "",
    evolutionDispatchPath: settings.evolutionDispatchPath ?? "/message/sendText",
    ownerPhone,
    whatsappBotEnabled:
      settings.whatsappBotEnabled === undefined ? true : Boolean(settings.whatsappBotEnabled),
    orderReadyNotificationsEnabled: Boolean(settings.orderReadyNotificationsEnabled),
    debtWarningsEnabled: Boolean(settings.debtWarningsEnabled),
    debtAutoCronEnabled: Boolean(settings.debtAutoCronEnabled),
    debtAutoCronTime: /^([01]\d|2[0-3]):[0-5]\d$/.test(String(settings.debtAutoCronTime ?? ""))
      ? String(settings.debtAutoCronTime)
      : "09:00",
    dailyMetricsEnabled: Boolean(settings.dailyMetricsEnabled),
    messageBufferMs: Number(settings.messageBufferMs) > 0 ? Number(settings.messageBufferMs) : 2500,
  };
}

async function persistSettings(settings) {
  await mkdir(dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

// Coleta overrides de env vars (precedencia sobre arquivo local) —
// resolve o caso de containers efemeros onde .runtime/chatbot-config.json
// some entre redeploys.
function getEnvOverrides() {
  const overrides = {};

  if (process.env.EVOLUTION_API_URL) {
    overrides.evolutionApiUrl = process.env.EVOLUTION_API_URL;
  }
  if (process.env.EVOLUTION_API_KEY) {
    overrides.evolutionApiKey = process.env.EVOLUTION_API_KEY;
  }
  if (process.env.EVOLUTION_DISPATCH_PATH) {
    overrides.evolutionDispatchPath = process.env.EVOLUTION_DISPATCH_PATH;
  }

  return overrides;
}

// Le configuracoes do disco; falha silenciosa retorna apenas DEFAULT_SETTINGS.
export async function getChatbotSettings() {
  let persisted = {};

  try {
    persisted = JSON.parse(await readFile(SETTINGS_PATH, "utf8"));
  } catch {
    persisted = {};
  }

  let settings = sanitizeSettings({
    ...DEFAULT_SETTINGS,
    ...persisted,
    ...getEnvOverrides(),
  });

  const defaultOwnerPhone = await resolveDefaultOwnerPhone();
  let needsPersist = false;

  if (isLegacyOwnerPhonePlaceholder(settings.ownerPhone) || !settings.ownerPhone) {
    settings = {
      ...settings,
      ownerPhone: defaultOwnerPhone,
    };
    needsPersist = true;
  }

  if (needsPersist) {
    await persistSettings(settings);
  }

  return settings;
}

// Mescla payload do painel com configuracao atual e persiste em .runtime/chatbot-config.json.
export async function updateChatbotSettings(data) {
  const current = await getChatbotSettings();
  const next = sanitizeSettings({
    ...current,
    evolutionApiUrl: data.evolutionApiUrl,
    evolutionApiKey: data.evolutionApiKey,
    evolutionDispatchPath: data.evolutionDispatchPath,
    ownerPhone: data.ownerPhone,
    whatsappBotEnabled:
      data.whatsappBotEnabled === undefined ? current.whatsappBotEnabled : data.whatsappBotEnabled,
    orderReadyNotificationsEnabled: data.orderReadyNotificationsEnabled,
    debtWarningsEnabled: data.debtWarningsEnabled,
    debtAutoCronEnabled:
      data.debtAutoCronEnabled === undefined ? current.debtAutoCronEnabled : data.debtAutoCronEnabled,
    debtAutoCronTime: data.debtAutoCronTime ?? current.debtAutoCronTime,
    dailyMetricsEnabled: data.dailyMetricsEnabled,
    messageBufferMs: data.messageBufferMs,
  });

  await persistSettings(next);

  return next;
}
