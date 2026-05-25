import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import {
  ensurePositiveNumber,
  normalizeImagemUrl,
  parseId,
  requireFields,
  toMoney,
} from "../utils/validation.js";
import { uploadProdutoImagemBase64 } from "./produtoImagemStorageService.js";

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

async function buildProdutoData(data, { partial = false } = {}) {
  if (!partial) {
    requireFields(data, ["codigoBarras", "nome", "precoBase", "categoria"]);
  }

  const produtoData = {
    codigoBarras: data.codigoBarras,
    nome: data.nome,
    categoria: data.categoria,
    ativo: data.ativo,
  };

  if (data.imagemUrl !== undefined) {
    const raw = data.imagemUrl;
    // Aceita data URI (base64) vindo do front: faz upload para o Supabase
    // Storage e persiste apenas a URL publica resultante.
    if (typeof raw === "string" && /^data:/i.test(raw.trim())) {
      const uploadedUrl = await uploadProdutoImagemBase64(raw, { nomeProduto: data.nome });
      produtoData.imagemUrl = uploadedUrl ?? null;
    } else {
      produtoData.imagemUrl = normalizeImagemUrl(raw);
    }
  }

  if (data.precoBase !== undefined) {
    produtoData.precoBase = toMoney(ensurePositiveNumber(data.precoBase, "precoBase"));
  }

  return produtoData;
}

export async function createProduto(data) {
  const produto = await prisma.produto.create({
    data: await buildProdutoData(data),
  });

  return serializeProduto(produto);
}

export async function listProdutos({ busca = "", categoria = "", page = 1, limit = 10 } = {}) {
  const paginaAtual = Math.max(Number(page) || 1, 1);
  const limiteAtual = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const skip = (paginaAtual - 1) * limiteAtual;
  const termoBusca = String(busca).trim();
  const categoriaFiltro = String(categoria).trim();
  const where = {
    ativo: true,
    ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}),
    ...(termoBusca
      ? {
          OR: [
            { nome: { contains: termoBusca, mode: "insensitive" } },
            { codigoBarras: { contains: termoBusca, mode: "insensitive" } },
            { categoria: { contains: termoBusca, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [produtos, total] = await prisma.$transaction([
    prisma.produto.findMany({
      where,
      orderBy: { id: "asc" },
      skip,
      take: limiteAtual,
    }),
    prisma.produto.count({ where }),
  ]);

  return {
    data: produtos.map(serializeProduto),
    pagination: {
      page: paginaAtual,
      limit: limiteAtual,
      total,
      totalPages: Math.max(Math.ceil(total / limiteAtual), 1),
    },
  };
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
    data: await buildProdutoData(data, { partial: true }),
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
