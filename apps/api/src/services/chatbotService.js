import { prisma } from "../config/prisma.js";
import { StatusNotificacao } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { parseId } from "../utils/validation.js";
import { dispatchWhatsAppText } from "./evolutionService.js";
import { getRelatorioDashboard, getRelatorioVendas } from "./relatorioService.js";
import { getChatbotSettings } from "./chatbotSettingsService.js";

function onlyDigits(value = "") {
  return String(value).replace(/\D/g, "");
}

function normalizePhone(value = "") {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return digits.startsWith("55") ? digits : `55${digits}`;
}

async function findClienteCadastrado({ telefone, cpf }) {
  const telefoneDigits = onlyDigits(telefone);
  const cpfDigits = onlyDigits(cpf);
  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    include: { contaFiado: true },
  });

  return clientes.find((cliente) => {
    const samePhone = telefoneDigits && onlyDigits(cliente.telefone).endsWith(telefoneDigits.slice(-11));
    const sameCpf = cpfDigits && onlyDigits(cliente.cpf) === cpfDigits;

    return samePhone || sameCpf;
  });
}

export async function consultarClienteChatbot(data) {
  const cliente = await findClienteCadastrado(data);

  if (!cliente) {
    throw new AppError("Cliente nao cadastrado. Cadastre o cliente antes de liberar pedidos pelo WhatsApp.", 403);
  }

  return {
    id: cliente.id,
    nome: cliente.nome,
    telefone: cliente.telefone,
    cpf: cliente.cpf,
    statusSerasa: cliente.statusSerasa,
    saldoFiado: Number(cliente.contaFiado?.saldoDevedor ?? 0),
  };
}

export async function criarPedidoChatbot(data) {
  const cliente = await findClienteCadastrado(data);

  if (!cliente) {
    throw new AppError("Pedidos pelo WhatsApp sao permitidos apenas para clientes cadastrados.", 403);
  }

  if (!Array.isArray(data.itens) || data.itens.length === 0) {
    throw new AppError("Informe ao menos um item para consultar disponibilidade do pedido.", 400);
  }

  const produtoIds = data.itens.map((item) => parseId(item.produtoId, "produtoId"));
  const produtos = await prisma.produto.findMany({
    where: {
      id: { in: produtoIds },
      ativo: true,
    },
  });
  const produtosById = new Map(produtos.map((produto) => [produto.id, produto]));
  let valorEstimado = 0;
  const itens = data.itens.map((item) => {
    const produtoId = parseId(item.produtoId, "produtoId");
    const quantidade = Number(item.quantidade);
    const produto = produtosById.get(produtoId);

    if (!produto || !Number.isInteger(quantidade) || quantidade <= 0) {
      throw new AppError("Pedido contem produto inexistente ou quantidade invalida.", 400);
    }

    const subtotal = Number(produto.precoBase) * quantidade;
    valorEstimado += subtotal;

    return {
      produtoId,
      produto: produto.nome,
      quantidade,
      subtotal,
    };
  });

  return {
    clienteId: cliente.id,
    cliente: cliente.nome,
    status: "CONSULTADO",
    valorEstimado,
    itens,
    mensagem: "Cliente cadastrado e itens validos. Registro persistente de pedido sera feito em modulo proprio, sem usuario operador.",
  };
}

export async function consultarPedidoChatbot(idParam, data = {}) {
  const id = parseId(idParam);
  const cliente = data.telefone || data.cpf ? await findClienteCadastrado(data) : null;
  const venda = await prisma.venda.findFirst({
    where: {
      id,
      ...(cliente ? { clienteId: cliente.id } : {}),
    },
    include: {
      cliente: true,
      itens: { include: { produto: true } },
    },
  });

  if (!venda) {
    throw new AppError("Pedido nao encontrado para este cliente.", 404);
  }

  return {
    pedidoId: venda.id,
    status: venda.status,
    cliente: venda.cliente?.nome,
    valorTotal: Number(venda.valorTotal),
    itens: venda.itens.map((item) => ({
      produto: item.produto?.nome ?? "Produto nao informado",
      quantidade: item.quantidade,
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function avisarPedidoPronto(idParam) {
  const settings = await getChatbotSettings();

  if (!settings.orderReadyNotificationsEnabled) {
    throw new AppError("Avisos de pedido pronto estao desativados nas configuracoes do chatbot.", 409);
  }

  const id = parseId(idParam);
  const venda = await prisma.venda.findUnique({
    where: { id },
    include: { cliente: true },
  });

  if (!venda?.cliente) {
    throw new AppError("Pedido nao encontrado ou sem cliente vinculado.", 404);
  }

  const mensagem = `Ola, ${venda.cliente.nome}. Seu pedido ${venda.id} da Padaria Pao Fresquim esta pronto para coleta.`;
  const dispatch = await dispatchWhatsAppText({
    phone: normalizePhone(venda.cliente.telefone),
    message: mensagem,
  });
  const updated = await prisma.venda.update({
    where: { id },
    data: { status: "CONCLUIDA" },
  });

  return {
    pedidoId: updated.id,
    status: updated.status,
    dispatch,
  };
}

export async function enviarAvisoSerasaFiado(clienteIdParam) {
  const settings = await getChatbotSettings();

  if (!settings.debtWarningsEnabled) {
    throw new AppError("Avisos de fiado/Serasa estao desativados nas configuracoes do chatbot.", 409);
  }

  const clienteId = parseId(clienteIdParam, "clienteId");
  const conta = await prisma.contaFiado.findUnique({
    where: { clienteId },
    include: { cliente: true },
  });

  if (!conta || Number(conta.saldoDevedor) <= 0) {
    throw new AppError("Cliente nao possui saldo de fiado em aberto.", 404);
  }

  const mensagem = `Ola, ${conta.cliente.nome}. Consta debito de fiado de R$ ${Number(conta.saldoDevedor).toFixed(2)} na Padaria Pao Fresquim. Regularize para evitar envio ao Serasa.`;
  const dispatch = await dispatchWhatsAppText({
    phone: normalizePhone(conta.cliente.telefone),
    message: mensagem,
  });

  const updated = await prisma.contaFiado.update({
    where: { clienteId },
    data: {
      dataUltimaCobranca: new Date(),
      statusNotificacao: StatusNotificacao.ENVIADA,
    },
  });

  return {
    clienteId,
    saldoDevedor: Number(updated.saldoDevedor),
    statusNotificacao: updated.statusNotificacao,
    dispatch,
  };
}

export async function getMetricasDiariasChatbot() {
  const settings = await getChatbotSettings();

  if (!settings.dailyMetricsEnabled) {
    throw new AppError("Metricas diarias estao desativadas nas configuracoes do chatbot.", 409);
  }

  const hoje = new Date();
  const dataInicio = hoje.toISOString().slice(0, 10);
  const dashboard = await getRelatorioDashboard();
  const vendas = await getRelatorioVendas({ dataInicio, dataFim: dataInicio });
  const pedidosPendentes = await prisma.venda.count({
    where: {
      status: "PENDENTE",
      dataHora: {
        gte: new Date(`${dataInicio}T00:00:00.000Z`),
      },
    },
  });

  return {
    ...dashboard,
    pedidosPendentes,
    topProducts: vendas.topProducts,
  };
}

export async function handleEvolutionWebhook(payload) {
  const remoteJid = payload?.data?.key?.remoteJid ?? payload?.key?.remoteJid ?? payload?.from;
  const text =
    payload?.data?.message?.conversation ??
    payload?.data?.message?.extendedTextMessage?.text ??
    payload?.message?.text ??
    "";
  const telefone = normalizePhone(remoteJid);
  const cliente = telefone ? await findClienteCadastrado({ telefone }) : null;

  return {
    received: true,
    telefone,
    clienteCadastrado: Boolean(cliente),
    clienteId: cliente?.id ?? null,
    mensagem: text,
    intent: inferIntent(text),
  };
}

function inferIntent(text) {
  const normalized = text.toLowerCase();

  if (normalized.includes("pedido") || normalized.includes("comprar")) {
    return "PEDIDO";
  }

  if (normalized.includes("fiado") || normalized.includes("debito") || normalized.includes("devo")) {
    return "FIADO";
  }

  if (normalized.includes("pronto") || normalized.includes("coleta")) {
    return "STATUS_PEDIDO";
  }

  return "ATENDIMENTO";
}
