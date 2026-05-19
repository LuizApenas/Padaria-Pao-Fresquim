import { Router } from "express";

import {
  createCliente,
  deleteCliente,
  getClienteById,
  listClientes,
  updateCliente,
} from "../services/clienteService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureAuth, ensureRole } from "../middlewares/auth.js";

const clientesRoutes = Router();

clientesRoutes.use(ensureAuth);

clientesRoutes.post(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const cliente = await createCliente(request.body);

    response.status(201).json(cliente);
  }),
);

clientesRoutes.get(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const clientes = await listClientes(request.query);

    response.status(200).json(clientes);
  }),
);

clientesRoutes.get(
  "/:id",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const cliente = await getClienteById(request.params.id);

    response.status(200).json(cliente);
  }),
);

clientesRoutes.put(
  "/:id",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const cliente = await updateCliente(request.params.id, request.body);

    response.status(200).json(cliente);
  }),
);

clientesRoutes.delete(
  "/:id",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    await deleteCliente(request.params.id);

    response.status(204).send();
  }),
);

export { clientesRoutes };
