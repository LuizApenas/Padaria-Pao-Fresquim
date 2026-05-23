// apps/api/src/services/chatbotMessageBufferService.js
// Buffer por conversa (debounce): agrupa mensagens rapidas antes de processar o chatbot.

import { getChatbotSettings } from "./chatbotSettingsService.js";

const DEFAULT_BUFFER_MS = 2500;
const MIN_BUFFER_MS = 500;
const MAX_BUFFER_MS = 15000;

/** @type {Map<string, { texts: string[], timer: ReturnType<typeof setTimeout> | null, meta: Record<string, unknown> }>} */
const conversationBuffers = new Map();

/**
 * Resolve o atraso do debounce: env CHATBOT_MESSAGE_BUFFER_MS tem prioridade,
 * depois messageBufferMs no JSON de configuracoes, senao padrao 2500 ms.
 */
export async function resolveMessageBufferDelayMs() {
  const envValue = Number(process.env.CHATBOT_MESSAGE_BUFFER_MS);

  if (Number.isFinite(envValue) && envValue >= MIN_BUFFER_MS) {
    return Math.min(envValue, MAX_BUFFER_MS);
  }

  const settings = await getChatbotSettings();
  const settingsValue = Number(settings.messageBufferMs);

  if (Number.isFinite(settingsValue) && settingsValue >= MIN_BUFFER_MS) {
    return Math.min(settingsValue, MAX_BUFFER_MS);
  }

  return DEFAULT_BUFFER_MS;
}

/**
 * Enfileira texto para a conversa; reinicia o timer a cada nova mensagem.
 * @param {{ key: string, text: string, delayMs: number, meta?: Record<string, unknown>, onFlush: (entry: { key: string, texts: string[], meta: Record<string, unknown> }) => void | Promise<void> }} options
 */
export function enqueueConversationMessage({ key, text, delayMs, meta = {}, onFlush }) {
  const trimmed = String(text ?? "").trim();

  if (!key || !trimmed) {
    return { buffered: false, reason: "empty_key_or_text" };
  }

  let entry = conversationBuffers.get(key);

  if (!entry) {
    entry = { texts: [], timer: null, meta: { ...meta } };
    conversationBuffers.set(key, entry);
  } else {
    entry.meta = { ...entry.meta, ...meta };
  }

  entry.texts.push(trimmed);

  if (entry.timer) {
    clearTimeout(entry.timer);
  }

  const delay = Math.max(MIN_BUFFER_MS, Number(delayMs) || DEFAULT_BUFFER_MS);

  entry.timer = setTimeout(() => {
    void flushConversationBuffer(key, onFlush);
  }, delay);

  return {
    buffered: true,
    bufferKey: key,
    bufferSize: entry.texts.length,
    debounceMs: delay,
  };
}

/**
 * Dispara o flush: remove o buffer da memoria e chama o processamento uma vez.
 */
async function flushConversationBuffer(key, onFlush) {
  const entry = conversationBuffers.get(key);

  if (!entry) {
    return;
  }

  conversationBuffers.delete(key);

  if (entry.timer) {
    clearTimeout(entry.timer);
    entry.timer = null;
  }

  const texts = [...entry.texts];

  if (texts.length === 0) {
    return;
  }

  try {
    await onFlush({ key, texts, meta: entry.meta });
  } catch (error) {
    console.error("[chatbot-buffer] Erro ao processar mensagens agrupadas:", error);
  }
}

/** Limpa um buffer especifico (encerramento de conversa). */
export function clearConversationBuffer(key) {
  const entry = conversationBuffers.get(key);
  if (!entry) return false;
  if (entry.timer) clearTimeout(entry.timer);
  conversationBuffers.delete(key);
  return true;
}

/** Utilitario para testes ou reinicio manual do processo. */
export function clearAllConversationBuffers() {
  for (const entry of conversationBuffers.values()) {
    if (entry.timer) {
      clearTimeout(entry.timer);
    }
  }

  conversationBuffers.clear();
}

export function getConversationBufferSnapshot() {
  return Array.from(conversationBuffers.entries()).map(([key, entry]) => ({
    key,
    pendingMessages: entry.texts.length,
    meta: entry.meta,
  }));
}
