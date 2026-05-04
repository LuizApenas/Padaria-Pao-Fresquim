import { Router } from "express";

import {
  createProduto,
  deleteProduto,
  getProdutoById,
  listProdutos,
  updateProduto,
} from "../services/produtoService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const produtosRoutes = Router();

produtosRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const produto = await createProduto(request.body);

    response.status(201).json(produto);
  }),
);

produtosRoutes.get(
  "/",
  asyncHandler(async (_request, response) => {
    const produtos = await listProdutos();

    response.status(200).json(produtos);
  }),
);

produtosRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const produto = await getProdutoById(request.params.id);

    response.status(200).json(produto);
  }),
);

produtosRoutes.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const produto = await updateProduto(request.params.id, request.body);

    response.status(200).json(produto);
  }),
);

produtosRoutes.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    await deleteProduto(request.params.id);

    response.status(204).send();
  }),
);

export { produtosRoutes };
