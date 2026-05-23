// apps/api/src/services/debtCronService.js
// Rotina diaria de cobranca: a cada 60s checa o horario configurado em
// chatbotSettings.debtAutoCronTime. Quando bate (HH:MM em America/Sao_Paulo)
// e a flag debtAutoCronEnabled esta ligada, dispara cobranca em massa.

import { prisma } from "../config/prisma.js";
import { getChatbotSettings } from "./chatbotSettingsService.js";
import { registrarCobrancaFiado } from "./fiadoService.js";

const TICK_MS = 60_000;
const TIMEZONE = "America/Sao_Paulo";

let timer = null;
let lastFiredAt = null;

function currentHhmmSaoPaulo() {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(new Date());
}

function todayKeySaoPaulo() {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

async function runDebtCampaign() {
  const contas = await prisma.contaFiado.findMany({
    where: { saldoDevedor: { gt: 0 } },
    select: { clienteId: true },
  });

  let enviados = 0;
  let falhas = 0;
  for (const c of contas) {
    try {
      const result = await registrarCobrancaFiado(c.clienteId);
      if (result?.statusNotificacao === "ENVIADA") enviados += 1;
      else falhas += 1;
    } catch (error) {
      falhas += 1;
      console.error("[debt-cron] cliente", c.clienteId, "falha:", error?.message);
    }
  }

  console.log(`[debt-cron] disparo concluido: ${enviados} enviados, ${falhas} falhas, total ${contas.length}.`);
}

async function tick() {
  try {
    const settings = await getChatbotSettings();
    if (!settings.debtAutoCronEnabled) return;
    if (!settings.debtWarningsEnabled) return;

    const target = settings.debtAutoCronTime || "09:00";
    const now = currentHhmmSaoPaulo();
    const todayKey = todayKeySaoPaulo();

    if (now === target && lastFiredAt !== todayKey) {
      lastFiredAt = todayKey;
      console.log(`[debt-cron] horario ${target} atingido. Iniciando campanha de cobranca.`);
      await runDebtCampaign();
    }
  } catch (error) {
    console.error("[debt-cron] tick falhou:", error?.message);
  }
}

export function startDebtCron() {
  if (timer) return;
  console.log("[debt-cron] scheduler iniciado (tick a cada 60s).");
  timer = setInterval(tick, TICK_MS);
  // Roda um tick imediato sem disparar disparo real (so verifica settings).
  tick().catch(() => {});
}

export function stopDebtCron() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
