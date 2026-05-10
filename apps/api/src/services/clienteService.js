import { prisma } from "../config/prisma.js";
import { StatusSerasa } from "../domain/enums.js";
import { AppError } from "../utils/AppError.js";
import { ensureEnumValue, parseId, requireFields } from "../utils/validation.js";

const clienteInclude = {
  contaFiado: true,
  vendas: true,
};

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
  return prisma.cliente.create({
    data: buildClienteData(data),
    include: clienteInclude,
  });
}

export async function listClientes() {
  return prisma.cliente.findMany({
    orderBy: { id: "asc" },
    include: clienteInclude,
  });
}

export async function getClienteById(idParam) {
  const id = parseId(idParam);
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: clienteInclude,
  });

  if (!cliente) {
    throw new AppError("Cliente nao encontrado.", 404);
  }

  return cliente;
}

export async function updateCliente(idParam, data) {
  const id = parseId(idParam);

  await getClienteById(id);

  return prisma.cliente.update({
    where: { id },
    data: buildClienteData(data, { partial: true }),
    include: clienteInclude,
  });
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
