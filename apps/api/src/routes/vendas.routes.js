import { Router } from "express";

import {
  createVenda,
  deleteVenda,
  getVendaById,
  listVendas,
  updateVenda,
} from "../services/vendaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const vendasRoutes = Router();

vendasRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const venda = await createVenda(request.body);

    response.status(201).json(venda);
  }),
);

vendasRoutes.get(
  "/",
  asyncHandler(async (request, response) => {
    const vendas = await listVendas(request.query);

    response.status(200).json(vendas);
  }),
);

vendasRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const venda = await getVendaById(request.params.id);

    response.status(200).json(venda);
  }),
);

vendasRoutes.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const venda = await updateVenda(request.params.id, request.body);

    response.status(200).json(venda);
  }),
);

vendasRoutes.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    await deleteVenda(request.params.id);

    response.status(204).send();
  }),
);

export { vendasRoutes };
