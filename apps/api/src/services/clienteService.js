import { prisma } from "../config/prisma.js";
import { StatusSerasa, StatusVenda } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, parseId, requireFields } from "../utils/validation.js";

const clienteInclude = {
  contaFiado: true,
  vendas: true,
};

function getClienteInitials(nome) {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "")
    .join("");
}

function getClienteStatus(cliente) {
  if (!cliente.ativo) {
    return "Inativo";
  }

  if (cliente.statusSerasa === StatusSerasa.NEGATIVADO) {
    return "Bloqueado";
  }

  return "Ativo";
}

function getClienteDebtStatus(cliente) {
  const saldoDevedor = Number(cliente.contaFiado?.saldoDevedor ?? 0);

  if (cliente.statusSerasa === StatusSerasa.NEGATIVADO) {
    return "Bloqueado";
  }

  if (saldoDevedor > 0) {
    return "Fiado ativo";
  }

  return "Em dia";
}

function getClienteTicket(cliente) {
  const vendasValidas = cliente.vendas.filter((venda) => venda.status !== StatusVenda.CANCELADA);

  if (vendasValidas.length === 0) {
    return 0;
  }

  const valorTotal = vendasValidas.reduce((soma, venda) => soma + Number(venda.valorTotal), 0);

  return Number((valorTotal / vendasValidas.length).toFixed(2));
}

function serializeCliente(cliente) {
  if (!cliente) {
    return cliente;
  }

  return {
    ...cliente,
    name: cliente.nome,
    phone: cliente.telefone,
    address: cliente.endereco,
    initials: getClienteInitials(cliente.nome),
    status: getClienteStatus(cliente),
    debtStatus: getClienteDebtStatus(cliente),
    ticket: getClienteTicket(cliente),
  };
}

function buildClienteData(data, { partial = false } = {}) {
  if (!partial) {
    requireFields(data, ["nome", "telefone", "endereco", "cpf"]);
  }

  ensureEnumValue(
    data.statusSerasa,
    Object.values(StatusSerasa),
    "statusSerasa",
  );

  return {
    nome: data.nome,
    telefone: data.telefone,
    endereco: data.endereco,
    cpf: data.cpf,
    statusSerasa: data.statusSerasa,
    ativo: data.ativo,
  };
}

export async function createCliente(data) {
  const cliente = await prisma.cliente.create({
    data: buildClienteData(data),
    include: clienteInclude,
  });

  return serializeCliente(cliente);
}

export async function listClientes({ busca = "", page = 1, limit = 10 } = {}) {
  const paginaAtual = Math.max(Number(page) || 1, 1);
  const limiteAtual = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (paginaAtual - 1) * limiteAtual;
  const termoBusca = String(busca).trim();
  const where = {
    ativo: true,
    ...(termoBusca
      ? {
          OR: [
            { nome: { contains: termoBusca, mode: "insensitive" } },
            { cpf: { contains: termoBusca, mode: "insensitive" } },
            { telefone: { contains: termoBusca, mode: "insensitive" } },
            { endereco: { contains: termoBusca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [clientes, total] = await prisma.$transaction([
    prisma.cliente.findMany({
      where,
      orderBy: { id: "asc" },
      skip,
      take: limiteAtual,
      include: clienteInclude,
    }),
    prisma.cliente.count({ where }),
  ]);

  return {
    data: clientes.map(serializeCliente),
    pagination: {
      page: paginaAtual,
      limit: limiteAtual,
      total,
      totalPages: Math.max(Math.ceil(total / limiteAtual), 1),
    },
  };
}

export async function getClienteById(idParam) {
  const id = parseId(idParam);
  const cliente = await prisma.cliente.findFirst({
    where: { id, ativo: true },
    include: clienteInclude,
  });

  if (!cliente) {
    throw new AppError("Cliente nao encontrado.", 404);
  }

  return serializeCliente(cliente);
}

export async function updateCliente(idParam, data) {
  const id = parseId(idParam);

  await getClienteById(id);

  const cliente = await prisma.cliente.update({
    where: { id },
    data: buildClienteData(data, { partial: true }),
    include: clienteInclude,
  });

  return serializeCliente(cliente);
}

export async function deleteCliente(idParam) {
  const id = parseId(idParam);
  const contaFiado = await prisma.contaFiado.findUnique({
    where: { clienteId: id },
  });

  await getClienteById(id);

  if (contaFiado && Number(contaFiado.saldoDevedor) > 0) {
    throw new AppError("Nao e possivel excluir cliente com fiado em aberto.", 400);
  }

  await prisma.cliente.update({
    where: { id },
    data: { ativo: false },
  });
}
