import { AppError } from "../utils/AppError.js";
import { getChatbotSettings } from "./chatbotSettingsService.js";

function buildDispatchUrl({ baseUrl, dispatchPath }) {
  const cleanBase = baseUrl.replace(/\/+$/, "");

  // Se a baseUrl ja contem um path (ex: /message/sendText/Instancia),
  // usamos como URL completa e ignoramos o dispatchPath.
  try {
    const parsed = new URL(cleanBase);
    if (parsed.pathname && parsed.pathname !== "/") {
      return cleanBase;
    }
  } catch {
    // baseUrl invalida; deixa o fetch falhar com mensagem clara mais a frente.
  }

  if (!dispatchPath) {
    return cleanBase;
  }

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

  const dispatchUrl = buildDispatchUrl(config);

  let response;
  try {
    response = await fetch(dispatchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey ? { apikey: config.apiKey } : {}),
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    throw new AppError(
      `Falha ao alcancar Evolution (${dispatchUrl}): ${error.message}`,
      502,
    );
  }

  if (!response.ok) {
    const body = await response.text();

    throw new AppError(
      `Evolution respondeu ${response.status} em ${dispatchUrl}: ${body || response.statusText}`,
      502,
    );
  }

  return response.json().catch(() => ({ ok: true }));
}
