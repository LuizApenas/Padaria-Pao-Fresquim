// apps/api/src/services/chatbotEventosService.js
// Append-only log de eventos do chatbot + agregacoes para KPIs.

import { prisma } from "../config/prisma.js";

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
  const rows = await prisma.chatbotEvento.groupBy({
    by: ["tipo"],
    where: {
      tipo: { in: tipos },
      criadoEm: { gte: inicio, lt: fim },
    },
    _count: { _all: true },
  });

  const map = {};
  for (const t of tipos) map[t] = 0;
  for (const r of rows) map[r.tipo] = r._count._all;
  return map;
}

/**
 * KPIs do chatbot para o periodo (default: mes corrente):
 * - pedidosIniciados, pedidosValidados, taxaConversaoPedidos
 * - cobrancasDisparadas, pagamentosPosCobranca, taxaCobrancaEfetiva
 * - handoffsHumanos
 */
export async function getChatbotKpis({ dataInicio, dataFim } = {}) {
  const now = new Date();
  const inicio = dataInicio
    ? new Date(`${dataInicio}T00:00:00`)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const fim = dataFim
    ? new Date(`${dataFim}T23:59:59.999`)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);

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
  const existe = await prisma.chatbotEvento.findFirst({
    where: {
      tipo: CHATBOT_EVENTOS.COBRANCA_DISPARADA,
      clienteId,
      criadoEm: { gte: limite },
    },
    select: { id: true },
  });

  return Boolean(existe);
}
