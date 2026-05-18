import { prisma } from "../config/prisma.js";
import { StatusNotificacao } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, ensurePositiveNumber, parseId, requireFields, toMoney } from "../utils/validation.js";

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
    include: fiadoInclude,
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

  await getContaFiadoByClienteId(clienteId);

  const conta = await prisma.contaFiado.update({
    where: { clienteId },
    data: {
      dataUltimaCobranca: new Date(),
      statusNotificacao: StatusNotificacao.ENVIADA,
    },
    include: fiadoInclude,
  });

  return serializeContaFiado(conta);
}

export async function deleteContaFiado(clienteIdParam) {
  const clienteId = parseId(clienteIdParam, "clienteId");

  await getContaFiadoByClienteId(clienteId);
  await prisma.contaFiado.delete({
    where: { clienteId },
  });
}
