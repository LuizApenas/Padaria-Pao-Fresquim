import { Router } from "express";

import {
  createContaFiado,
  deleteContaFiado,
  getContaFiadoByClienteId,
  listContasFiado,
  registrarCobrancaFiado,
  updateContaFiado,
} from "../services/fiadoService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const fiadoRoutes = Router();

fiadoRoutes.get(
  "/",
  asyncHandler(async (_request, response) => {
    const contas = await listContasFiado();

    response.status(200).json(contas);
  }),
);

fiadoRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const conta = await createContaFiado(request.body);

    response.status(201).json(conta);
  }),
);

fiadoRoutes.get(
  "/:clienteId",
  asyncHandler(async (request, response) => {
    const conta = await getContaFiadoByClienteId(request.params.clienteId);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.put(
  "/:clienteId",
  asyncHandler(async (request, response) => {
    const conta = await updateContaFiado(request.params.clienteId, request.body);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.post(
  "/:clienteId/cobranca",
  asyncHandler(async (request, response) => {
    const conta = await registrarCobrancaFiado(request.params.clienteId);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.delete(
  "/:clienteId",
  asyncHandler(async (request, response) => {
    await deleteContaFiado(request.params.clienteId);

    response.status(204).send();
  }),
);

export { fiadoRoutes };
