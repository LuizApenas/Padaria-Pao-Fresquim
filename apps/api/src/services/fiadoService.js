import { prisma } from "../config/prisma.js";
import { StatusNotificacao } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, ensurePositiveNumber, parseId, requireFields, toMoney } from "../utils/validation.js";
import { startOfMonthSp, startOfNextMonthSp } from "../utils/timezone.js";
import {
  CHATBOT_EVENTOS,
  emitChatbotEvento,
  houveCobrancaRecente,
} from "./chatbotEventosService.js";
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

  // Evento de funil de cobranca: registra que a cobranca foi disparada,
  // independentemente do canal (WhatsApp/manual/cron). Pagamento posterior
  // pode ser correlacionado dentro da janela.
  void emitChatbotEvento({
    tipo: CHATBOT_EVENTOS.COBRANCA_DISPARADA,
    canal: "WHATSAPP",
    clienteId,
    payload: { saldo, status: result.statusNotificacao, erro: whatsappErro },
  });

  return result;
}

// Registra uma quitacao (parcial ou total) do fiado: cria linha em
// PagamentoFiado, decrementa saldoDevedor, atualiza status quando zerar.
export async function registrarPagamentoFiado(clienteIdParam, data = {}) {
  const clienteId = parseId(clienteIdParam, "clienteId");
  const valor = ensurePositiveNumber(data.valor, "valor");
  const observacao = typeof data.observacao === "string" ? data.observacao.trim() : null;
  const funcionarioId = data.funcionarioId ? parseId(data.funcionarioId, "funcionarioId") : null;

  const conta = await getContaFiadoByClienteId(clienteId);
  const saldoAtual = Number(conta.saldoDevedor);

  if (valor > saldoAtual + 0.001) {
    throw new AppError(
      `Valor (R$ ${valor.toFixed(2)}) maior que o saldo devedor atual (R$ ${saldoAtual.toFixed(2)}).`,
      400,
    );
  }

  const novoSaldo = Number(toMoney(saldoAtual - valor));

  const result = await prisma.$transaction(async (tx) => {
    const pagamento = await tx.pagamentoFiado.create({
      data: {
        contaFiadoId: conta.id,
        valor: toMoney(valor),
        observacao: observacao || undefined,
        funcionarioId: funcionarioId || undefined,
      },
    });

    const contaAtualizada = await tx.contaFiado.update({
      where: { clienteId },
      data: {
        saldoDevedor: toMoney(novoSaldo),
        // Quando quita totalmente, marca como "nada pendente".
        statusNotificacao: novoSaldo <= 0 ? StatusNotificacao.NENHUMA : conta.statusNotificacao,
      },
      include: fiadoInclude,
    });

    return { pagamento, conta: contaAtualizada };
  });

  // Eventos de KPI:
  // 1) PAGAMENTO_REGISTRADO sempre
  // 2) COBRANCA_RESULTOU_PAGAMENTO se ha cobranca recente (janela 30 dias)
  void emitChatbotEvento({
    tipo: CHATBOT_EVENTOS.PAGAMENTO_REGISTRADO,
    canal: "FRONTEND",
    clienteId,
    funcionarioId: funcionarioId || null,
    payload: { valor, saldoAnterior: saldoAtual, saldoNovo: novoSaldo },
  });

  houveCobrancaRecente(clienteId, 30)
    .then((tinha) => {
      if (tinha) {
        return emitChatbotEvento({
          tipo: CHATBOT_EVENTOS.COBRANCA_RESULTOU_PAGAMENTO,
          canal: "FRONTEND",
          clienteId,
          payload: { valor, saldoNovo: novoSaldo },
        });
      }
      return null;
    })
    .catch((error) => {
      console.warn("[fiado] falha ao correlacionar cobranca/pagamento:", error?.message);
    });

  return {
    conta: serializeContaFiado(result.conta),
    pagamento: {
      id: result.pagamento.id,
      valor: Number(result.pagamento.valor),
      dataPagamento: result.pagamento.dataPagamento,
      observacao: result.pagamento.observacao,
      funcionarioId: result.pagamento.funcionarioId,
    },
  };
}

// Resumo da carteira: total em aberto, recuperado no mes corrente,
// quantidade de inadimplentes e status agregado da carteira.
export async function getResumoFiado() {
  // Mes corrente pelo calendario operacional da padaria.
  const inicioMes = startOfMonthSp();
  const fimMes = startOfNextMonthSp();

  const [totalAbertoAgg, inadimplentesCount, pagamentosMes] = await Promise.all([
    prisma.contaFiado.aggregate({
      where: { saldoDevedor: { gt: 0 } },
      _sum: { saldoDevedor: true },
    }),
    prisma.contaFiado.count({
      where: { saldoDevedor: { gt: 0 } },
    }),
    prisma.pagamentoFiado.aggregate({
      where: {
        dataPagamento: { gte: inicioMes, lt: fimMes },
      },
      _sum: { valor: true },
      _count: { _all: true },
    }),
  ]);

  const totalEmAberto = Number(totalAbertoAgg._sum.saldoDevedor ?? 0);
  const recuperadoNoMes = Number(pagamentosMes._sum.valor ?? 0);
  const pagamentosCountMes = Number(pagamentosMes._count._all ?? 0);

  // Status agregado simples: critico > 10 inadimplentes ou >5k em aberto;
  // atencao se houver pelo menos 1; ok se zero.
  let statusCarteira = "OK";
  if (totalEmAberto >= 5000 || inadimplentesCount >= 10) {
    statusCarteira = "CRITICO";
  } else if (inadimplentesCount > 0) {
    statusCarteira = "ATENCAO";
  }

  return {
    totalEmAberto,
    recuperadoNoMes,
    pagamentosCountMes,
    clientesInadimplentes: inadimplentesCount,
    statusCarteira,
    periodoMes: {
      inicio: inicioMes.toISOString(),
      fim: fimMes.toISOString(),
    },
  };
}

// Historico de pagamentos de um cliente (mais recentes primeiro).
export async function listPagamentosFiadoCliente(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");
  const conta = await getContaFiadoByClienteId(clienteId);

  const pagamentos = await prisma.pagamentoFiado.findMany({
    where: { contaFiadoId: conta.id },
    orderBy: { dataPagamento: "desc" },
    include: {
      funcionario: { select: { id: true, nome: true } },
    },
  });

  return pagamentos.map((p) => ({
    id: p.id,
    valor: Number(p.valor),
    dataPagamento: p.dataPagamento,
    observacao: p.observacao,
    funcionario: p.funcionario,
  }));
}

export async function deleteContaFiado(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");

  await getContaFiadoByClienteId(clienteId);
  await prisma.contaFiado.delete({
    where: { clienteId },
  });
}
