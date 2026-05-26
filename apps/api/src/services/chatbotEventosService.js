// apps/api/src/services/chatbotEventosService.js
// Append-only log de eventos do chatbot + agregacoes para KPIs.

import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { spDayBounds, startOfMonthSp, startOfNextMonthSp } from "../utils/timezone.js";

export const CHATBOT_EVENTOS = Object.freeze({
  PEDIDO_INICIADO: "PEDIDO_INICIADO",
  PEDIDO_VALIDADO: "PEDIDO_VALIDADO",
  COBRANCA_DISPARADA: "COBRANCA_DISPARADA",
  PAGAMENTO_REGISTRADO: "PAGAMENTO_REGISTRADO",
  COBRANCA_RESULTOU_PAGAMENTO: "COBRANCA_RESULTOU_PAGAMENTO",
  HANDOFF_HUMANO: "HANDOFF_HUMANO",
  MENU_ENVIADO: "MENU_ENVIADO",
});

/**
 * Emite um evento. Funcao "fire and forget" — nunca derruba o fluxo principal
 * se o write falhar (apenas loga).
 */
export async function emitChatbotEvento({
  tipo,
  canal = null,
  clienteId = null,
  funcionarioId = null,
  payload = null,
}) {
  try {
    await prisma.chatbotEvento.create({
      data: {
        tipo,
        canal: canal || undefined,
        clienteId: clienteId || undefined,
        funcionarioId: funcionarioId || undefined,
        payload: payload ? JSON.stringify(payload).slice(0, 4000) : undefined,
      },
    });
  } catch (error) {
    console.warn("[chatbot-eventos] falha ao registrar evento:", tipo, error?.message);
  }
}

/**
 * Conta eventos por tipo dentro de um periodo. Retorna {tipo: count, ...}.
 */
async function countEventosPorTipo(inicio, fim, tipos) {
  const map = {};
  for (const t of tipos) map[t] = 0;

  try {
    const rows = await prisma.chatbotEvento.groupBy({
      by: ["tipo"],
      where: {
        tipo: { in: tipos },
        criadoEm: { gte: inicio, lt: fim },
      },
      _count: { _all: true },
    });

    for (const r of rows) map[r.tipo] = r._count._all;
  } catch (error) {
    if (isChatbotEventosSchemaMissing(error)) {
      console.warn("[chatbot-eventos] tabela/coluna ausente; retornando KPIs zerados:", error?.message);
      return map;
    }

    throw error;
  }

  return map;
}

function isChatbotEventosSchemaMissing(error) {
  const code = error?.code || error?.cause?.code;
  const message = String(error?.message || error?.cause?.message || "").toLowerCase();

  return (
    code === "P2021" ||
    code === "P2022" ||
    code === "42P01" ||
    code === "42703" ||
    message.includes("chatbot_eventos") ||
    message.includes("chatbotEvento") ||
    message.includes("does not exist") ||
    message.includes("nao existe") ||
    message.includes("não existe")
  );
}

/**
 * KPIs do chatbot para o periodo (default: mes corrente):
 * - pedidosIniciados, pedidosValidados, taxaConversaoPedidos
 * - cobrancasDisparadas, pagamentosPosCobranca, taxaCobrancaEfetiva
 * - handoffsHumanos
 */
export async function getChatbotKpis({ dataInicio, dataFim } = {}) {
  if ((dataInicio && !dataFim) || (!dataInicio && dataFim)) {
    throw new AppError("Informe dataInicio e dataFim para consultar o periodo.", 400);
  }

  const customBounds = dataInicio || dataFim ? spDayBounds(dataInicio, dataFim) : null;
  const inicio = customBounds ? customBounds.inicio : startOfMonthSp();
  const fim = customBounds ? customBounds.fim : startOfNextMonthSp();

  if (!inicio || !fim) {
    throw new AppError("Periodo invalido. Use datas no formato YYYY-MM-DD.", 400);
  }

  if (inicio > fim) {
    throw new AppError("dataInicio nao pode ser maior que dataFim.", 400);
  }

  const counts = await countEventosPorTipo(inicio, fim, [
    CHATBOT_EVENTOS.PEDIDO_INICIADO,
    CHATBOT_EVENTOS.PEDIDO_VALIDADO,
    CHATBOT_EVENTOS.COBRANCA_DISPARADA,
    CHATBOT_EVENTOS.PAGAMENTO_REGISTRADO,
    CHATBOT_EVENTOS.COBRANCA_RESULTOU_PAGAMENTO,
    CHATBOT_EVENTOS.HANDOFF_HUMANO,
    CHATBOT_EVENTOS.MENU_ENVIADO,
  ]);

  const pedidosIniciados = counts[CHATBOT_EVENTOS.PEDIDO_INICIADO];
  const pedidosValidados = counts[CHATBOT_EVENTOS.PEDIDO_VALIDADO];
  const cobrancasDisparadas = counts[CHATBOT_EVENTOS.COBRANCA_DISPARADA];
  const pagamentosPosCobranca = counts[CHATBOT_EVENTOS.COBRANCA_RESULTOU_PAGAMENTO];

  const taxaConversaoPedidos =
    pedidosIniciados > 0
      ? Number(((pedidosValidados / pedidosIniciados) * 100).toFixed(1))
      : 0;

  const taxaCobrancaEfetiva =
    cobrancasDisparadas > 0
      ? Number(((pagamentosPosCobranca / cobrancasDisparadas) * 100).toFixed(1))
      : 0;

  return {
    periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
    pedidosIniciados,
    pedidosValidados,
    taxaConversaoPedidos,
    cobrancasDisparadas,
    pagamentosPosCobranca,
    pagamentosRegistrados: counts[CHATBOT_EVENTOS.PAGAMENTO_REGISTRADO],
    taxaCobrancaEfetiva,
    handoffsHumanos: counts[CHATBOT_EVENTOS.HANDOFF_HUMANO],
    menusEnviados: counts[CHATBOT_EVENTOS.MENU_ENVIADO],
  };
}

/**
 * Verifica se houve cobranca recente (default 30 dias) para o cliente — usado
 * para inferir COBRANCA_RESULTOU_PAGAMENTO quando registra-se um pagamento.
 */
export async function houveCobrancaRecente(clienteId, diasJanela = 30) {
  if (!clienteId) return false;

  const limite = new Date(Date.now() - diasJanela * 24 * 60 * 60 * 1000);
  let existe = null;

  try {
    existe = await prisma.chatbotEvento.findFirst({
      where: {
        tipo: CHATBOT_EVENTOS.COBRANCA_DISPARADA,
        clienteId,
        criadoEm: { gte: limite },
      },
      select: { id: true },
    });
  } catch (error) {
    if (isChatbotEventosSchemaMissing(error)) {
      console.warn("[chatbot-eventos] tabela/coluna ausente; ignorando correlacao de cobranca:", error?.message);
      return false;
    }

    throw error;
  }

  return Boolean(existe);
}
