import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  ensurePositiveNumber,
  parseId,
  requireFields,
  toMoney,
} from "../utils/validation.js";

const produtoInclude = {
  itensVenda: true,
};

function buildProdutoData(data, { partial = false } = {}) {
  if (!partial) {
    requireFields(data, ["codigoBarras", "nome", "precoBase", "categoria"]);
  }

  const produtoData = {
    codigoBarras: data.codigoBarras,
    nome: data.nome,
    categoria: data.categoria,
    imagemUrl: data.imagemUrl,
    ativo: data.ativo,
  };

  if (data.precoBase !== undefined) {
    produtoData.precoBase = toMoney(ensurePositiveNumber(data.precoBase, "precoBase"));
  }

  return produtoData;
}

export async function createProduto(data) {
  return prisma.produto.create({
    data: buildProdutoData(data),
    include: produtoInclude,
  });
}

export async function listProdutos() {
  return prisma.produto.findMany({
    orderBy: { id: "asc" },
    include: produtoInclude,
  });
}

export async function getProdutoById(idParam) {
  const id = parseId(idParam);
  const produto = await prisma.produto.findUnique({
    where: { id },
    include: produtoInclude,
  });

  if (!produto) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  return produto;
}

export async function updateProduto(idParam, data) {
  const id = parseId(idParam);

  await getProdutoById(id);

  return prisma.produto.update({
    where: { id },
    data: buildProdutoData(data, { partial: true }),
    include: produtoInclude,
  });
}

export async function deleteProduto(idParam) {
  const id = parseId(idParam);

  await getProdutoById(id);
  await prisma.produto.update({
    where: { id },
    data: { ativo: false },
  });
}
