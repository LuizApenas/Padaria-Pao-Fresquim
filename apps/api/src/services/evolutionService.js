import { AppError } from "../utils/AppError.js";
import { getChatbotSettings } from "./chatbotSettingsService.js";

function buildDispatchUrl({ baseUrl, dispatchPath }) {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = dispatchPath.replace(/^\/+/, "");

  return `${cleanBase}/${cleanPath}`;
}

export async function dispatchWhatsAppText({ phone, message }) {
  if (!phone || !message) {
    throw new AppError("Telefone e mensagem sao obrigatorios para disparo WhatsApp.", 400);
  }

  const settings = await getChatbotSettings();
  const config = {
    baseUrl: settings.evolutionApiUrl,
    apiKey: settings.evolutionApiKey,
    dispatchPath: settings.evolutionDispatchPath,
  };

  if (!config.baseUrl) {
    return {
      skipped: true,
      reason: "EVOLUTION_API_URL nao configurada.",
    };
  }

  const response = await fetch(buildDispatchUrl(config), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.apiKey ? { apikey: config.apiKey } : {}),
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });

  if (!response.ok) {
    const body = await response.text();

    throw new AppError(`Falha no disparo Evolution: ${body || response.statusText}`, 502);
  }

  return response.json().catch(() => ({ ok: true }));
}
