import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  ensurePositiveNumber,
  parseId,
  requireFields,
  toMoney,
} from "../utils/validation.js";

function serializeProduto(produto) {
  if (!produto) {
    return produto;
  }

  return {
    ...produto,
    name: produto.nome,
    category: produto.categoria,
    sku: produto.codigoBarras,
    barcode: produto.codigoBarras,
    imageUrl: produto.imagemUrl,
    price: Number(produto.precoBase),
    stock: 0,
    unit: "un",
  };
}

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
  const produto = await prisma.produto.create({
    data: buildProdutoData(data),
  });

  return serializeProduto(produto);
}

export async function listProdutos() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { id: "asc" },
  });

  return produtos.map(serializeProduto);
}

export async function listProdutoCategorias() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: { categoria: true },
    orderBy: { categoria: "asc" },
  });

  return [...new Set(produtos.map((produto) => produto.categoria).filter(Boolean))];
}

export async function getProdutoByCodigoBarras(codigoBarras) {
  const produto = await prisma.produto.findFirst({
    where: { codigoBarras, ativo: true },
  });

  if (!produto) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  return serializeProduto(produto);
}

export async function getProdutoById(idParam) {
  const id = parseId(idParam);
  const produto = await prisma.produto.findFirst({
    where: { id, ativo: true },
  });

  if (!produto) {
    throw new AppError("Produto nao encontrado.", 404);
  }

  return serializeProduto(produto);
}

export async function updateProduto(idParam, data) {
  const id = parseId(idParam);

  await getProdutoById(id);

  const produto = await prisma.produto.update({
    where: { id },
    data: buildProdutoData(data, { partial: true }),
  });

  return serializeProduto(produto);
}

export async function deleteProduto(idParam) {
  const id = parseId(idParam);

  await getProdutoById(id);
  await prisma.produto.update({
    where: { id },
    data: { ativo: false },
  });
}
