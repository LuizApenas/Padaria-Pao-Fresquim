import { Router } from "express";

import {
  cancelarVenda,
  createVenda,
  deleteVenda,
  getVendaById,
  listVendas,
  updateVenda,
} from "../services/vendaService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureAuth, ensureFuncionarioLinked, ensureRole } from "../middlewares/auth.js";

const vendasRoutes = Router();

vendasRoutes.use(ensureAuth);

vendasRoutes.post(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  ensureFuncionarioLinked,
  asyncHandler(async (request, response) => {
    const venda = await createVenda({
      ...request.body,
      funcionarioId: request.user.id,
    });

    response.status(201).json(venda);
  }),
);

vendasRoutes.get(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const vendas = await listVendas(request.query);

    response.status(200).json(vendas);
  }),
);

vendasRoutes.get(
  "/:id",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const venda = await getVendaById(request.params.id);

    response.status(200).json(venda);
  }),
);

vendasRoutes.patch(
  "/:id/cancelar",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const venda = await cancelarVenda(request.params.id);

    response.status(200).json(venda);
  }),
);

vendasRoutes.put(
  "/:id",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const venda = await updateVenda(request.params.id, request.body);

    response.status(200).json(venda);
  }),
);

vendasRoutes.delete(
  "/:id",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    await deleteVenda(request.params.id);

    response.status(204).send();
  }),
);

export { vendasRoutes };
