import { Router } from "express";

import {
  createProduto,
  deleteProduto,
  getProdutoByCodigoBarras,
  getProdutoById,
  listProdutoCategorias,
  listProdutos,
  updateProduto,
} from "../services/produtoService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureAuth, ensureRole } from "../middlewares/auth.js";

const produtosRoutes = Router();

produtosRoutes.use(ensureAuth);

produtosRoutes.post(
  "/",
  ensureRole("PROPRIETARIO", "PADEIRO"),
  asyncHandler(async (request, response) => {
    const produto = await createProduto(request.body);

    response.status(201).json(produto);
  }),
);

produtosRoutes.get(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE", "PADEIRO"),
  asyncHandler(async (request, response) => {
    const produtos = await listProdutos(request.query);

    response.status(200).json(produtos);
  }),
);

produtosRoutes.get(
  "/categorias",
  ensureRole("PROPRIETARIO", "ATENDENTE", "PADEIRO"),
  asyncHandler(async (_request, response) => {
    const categorias = await listProdutoCategorias();

    response.status(200).json(categorias);
  }),
);

produtosRoutes.get(
  "/codigo/:codigoBarras",
  ensureRole("PROPRIETARIO", "ATENDENTE", "PADEIRO"),
  asyncHandler(async (request, response) => {
    const produto = await getProdutoByCodigoBarras(request.params.codigoBarras);

    response.status(200).json(produto);
  }),
);

produtosRoutes.get(
  "/:id",
  ensureRole("PROPRIETARIO", "ATENDENTE", "PADEIRO"),
  asyncHandler(async (request, response) => {
    const produto = await getProdutoById(request.params.id);

    response.status(200).json(produto);
  }),
);

produtosRoutes.put(
  "/:id",
  ensureRole("PROPRIETARIO", "PADEIRO"),
  asyncHandler(async (request, response) => {
    const produto = await updateProduto(request.params.id, request.body);

    response.status(200).json(produto);
  }),
);

produtosRoutes.delete(
  "/:id",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    await deleteProduto(request.params.id);

    response.status(204).send();
  }),
);

export { produtosRoutes };
