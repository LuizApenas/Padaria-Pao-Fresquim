import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const SETTINGS_PATH = resolve(process.cwd(), ".runtime", "chatbot-config.json");

const DEFAULT_SETTINGS = {
  evolutionApiUrl: "",
  evolutionApiKey: "",
  evolutionDispatchPath: "/message/sendText",
  webhookToken: "",
  ownerPhone: "",
  orderReadyNotificationsEnabled: true,
  debtWarningsEnabled: true,
  dailyMetricsEnabled: true,
};

function sanitizeSettings(settings) {
  return {
    evolutionApiUrl: settings.evolutionApiUrl ?? "",
    evolutionApiKey: settings.evolutionApiKey ?? "",
    evolutionDispatchPath: settings.evolutionDispatchPath ?? "/message/sendText",
    webhookToken: settings.webhookToken ?? "",
    ownerPhone: settings.ownerPhone ?? "",
    orderReadyNotificationsEnabled: Boolean(settings.orderReadyNotificationsEnabled),
    debtWarningsEnabled: Boolean(settings.debtWarningsEnabled),
    dailyMetricsEnabled: Boolean(settings.dailyMetricsEnabled),
  };
}

export async function getChatbotSettings() {
  let persisted = {};

  try {
    persisted = JSON.parse(await readFile(SETTINGS_PATH, "utf8"));
  } catch {
    persisted = {};
  }

  return sanitizeSettings({
    ...DEFAULT_SETTINGS,
    ...persisted,
  });
}

export async function updateChatbotSettings(data) {
  const current = await getChatbotSettings();
  const next = sanitizeSettings({
    ...current,
    evolutionApiUrl: data.evolutionApiUrl,
    evolutionApiKey: data.evolutionApiKey,
    evolutionDispatchPath: data.evolutionDispatchPath,
    webhookToken: data.webhookToken,
    ownerPhone: data.ownerPhone,
    orderReadyNotificationsEnabled: data.orderReadyNotificationsEnabled,
    debtWarningsEnabled: data.debtWarningsEnabled,
    dailyMetricsEnabled: data.dailyMetricsEnabled,
  });

  await mkdir(dirname(SETTINGS_PATH), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2));

  return next;
}
