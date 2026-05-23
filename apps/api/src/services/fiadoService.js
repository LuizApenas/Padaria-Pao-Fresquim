import { prisma } from "../config/prisma.js";
import { StatusNotificacao } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, ensurePositiveNumber, parseId, requireFields, toMoney } from "../utils/validation.js";
import { getChatbotSettings } from "./chatbotSettingsService.js";
import { dispatchWhatsAppText } from "./evolutionService.js";

// Include "pesado" usado em consultas individuais (detalhe de fiado por cliente).
const fiadoInclude = {
  cliente: {
    include: {
      vendas: {
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
        },
      },
    },
  },
};

// Include "leve" para listagem da carteira: traz apenas a ultima venda e o
// ultimo item dela, suficiente para a coluna "Ultima compra" sem explodir o
// payload nem o tempo de resposta.
const fiadoListInclude = {
  cliente: {
    select: {
      id: true,
      nome: true,
      telefone: true,
      cpf: true,
      statusSerasa: true,
      vendas: {
        orderBy: { dataHora: "desc" },
        take: 1,
        select: {
          id: true,
          dataHora: true,
          itens: {
            take: 1,
            select: {
              subtotal: true,
              produto: { select: { nome: true } },
            },
          },
        },
      },
    },
  },
};

function serializeContaFiado(conta) {
  if (!conta) {
    return conta;
  }

  return {
    ...conta,
    saldoDevedor: Number(conta.saldoDevedor),
  };
}

async function ensureClienteAtivo(clienteId) {
  const cliente = await prisma.cliente.findFirst({
    where: { id: parseId(clienteId, "clienteId"), ativo: true },
  });

  if (!cliente) {
    throw new AppError("Cliente informado nao existe ou esta inativo.", 404);
  }

  return cliente;
}

export async function listContasFiado() {
  const contas = await prisma.contaFiado.findMany({
    where: {
      saldoDevedor: {
        gt: 0,
      },
    },
    orderBy: {
      saldoDevedor: "desc",
    },
    include: fiadoListInclude,
  });

  return contas.map(serializeContaFiado);
}

export async function getContaFiadoByClienteId(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");
  const conta = await prisma.contaFiado.findUnique({
    where: { clienteId },
    include: fiadoInclude,
  });

  if (!conta) {
    throw new AppError("Conta de fiado nao encontrada.", 404);
  }

  return serializeContaFiado(conta);
}

export async function createContaFiado(data) {
  requireFields(data, ["clienteId"]);
  const clienteId = parseId(data.clienteId, "clienteId");

  await ensureClienteAtivo(clienteId);
  ensureEnumValue(data.statusNotificacao, Object.values(StatusNotificacao), "statusNotificacao");

  const conta = await prisma.contaFiado.upsert({
    where: { clienteId },
    update: {
      saldoDevedor: data.saldoDevedor !== undefined ? toMoney(ensurePositiveNumber(data.saldoDevedor, "saldoDevedor")) : undefined,
      statusNotificacao: data.statusNotificacao,
    },
    create: {
      clienteId,
      saldoDevedor: data.saldoDevedor !== undefined ? toMoney(ensurePositiveNumber(data.saldoDevedor, "saldoDevedor")) : "0.00",
      statusNotificacao: data.statusNotificacao ?? StatusNotificacao.NENHUMA,
    },
    include: fiadoInclude,
  });

  return serializeContaFiado(conta);
}

export async function updateContaFiado(clienteIdParam, data) {
  const clienteId = parseId(clienteIdParam, "clienteId");

  await getContaFiadoByClienteId(clienteId);
  ensureEnumValue(data.statusNotificacao, Object.values(StatusNotificacao), "statusNotificacao");

  const conta = await prisma.contaFiado.update({
    where: { clienteId },
    data: {
      saldoDevedor: data.saldoDevedor !== undefined ? toMoney(ensurePositiveNumber(data.saldoDevedor, "saldoDevedor")) : undefined,
      statusNotificacao: data.statusNotificacao,
      dataUltimaCobranca: data.dataUltimaCobranca ? new Date(data.dataUltimaCobranca) : undefined,
    },
    include: fiadoInclude,
  });

  return serializeContaFiado(conta);
}

export async function registrarCobrancaFiado(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");

  const contaAtual = await getContaFiadoByClienteId(clienteId);

  // Tenta disparar WhatsApp ANTES de marcar ENVIADA, para nao mentir o status
  // quando o disparo falhar (sem telefone, chatbot desligado, Evolution off).
  const telefone = contaAtual?.cliente?.telefone ?? "";
  const saldo = Number(contaAtual?.saldoDevedor ?? 0);
  const nomeCliente = contaAtual?.cliente?.nome ?? "Cliente";
  const mensagem = [
    `Oi, ${nomeCliente.split(" ")[0] || nomeCliente}! 🥖`,
    "Aqui e a Padaria Pao FresQUIM passando para lembrar do seu fiado em aberto.",
    `Saldo atual: ${saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
    "Quando puder, da uma passada na padaria para regularizar. Qualquer duvida, e so responder por aqui.",
    "Obrigada!",
  ].join("\n");

  let whatsappStatus = StatusNotificacao.ENVIADA;
  let whatsappErro = null;

  if (telefone) {
    try {
      const settings = await getChatbotSettings();
      if (!settings.debtWarningsEnabled) {
        whatsappStatus = StatusNotificacao.PENDENTE;
        whatsappErro = "debt_warnings_disabled";
      } else {
        await dispatchWhatsAppText({ phone: telefone, message: mensagem });
      }
    } catch (error) {
      whatsappStatus = StatusNotificacao.FALHOU;
      whatsappErro = error?.message || "falha desconhecida no disparo";
      console.error("[fiado] cobranca WhatsApp falhou:", whatsappErro);
    }
  } else {
    whatsappStatus = StatusNotificacao.PENDENTE;
    whatsappErro = "cliente sem telefone cadastrado";
  }

  const conta = await prisma.contaFiado.update({
    where: { clienteId },
    data: {
      dataUltimaCobranca: new Date(),
      statusNotificacao: whatsappStatus,
    },
    include: fiadoInclude,
  });

  const result = serializeContaFiado(conta);
  if (whatsappErro) {
    result.whatsappErro = whatsappErro;
  }
  return result;
}

export async function deleteContaFiado(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");

  await getContaFiadoByClienteId(clienteId);
  await prisma.contaFiado.delete({
    where: { clienteId },
  });
}
