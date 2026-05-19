import { AppError } from "../utils/AppError.js";
import { getChatbotSettings } from "../services/chatbotSettingsService.js";

export async function ensureEvolutionWebhook(request, _response, next) {
  const settings = await getChatbotSettings();
  const expectedToken = settings.webhookToken;

  if (!expectedToken) {
    return next(new AppError("Token do webhook Evolution nao configurado no painel.", 500));
  }

  const providedToken =
    request.headers["x-evolution-token"] ??
    request.headers["x-webhook-token"] ??
    request.query.token;

  if (providedToken !== expectedToken) {
    return next(new AppError("Webhook Evolution nao autorizado.", 401));
  }

  return next();
}
