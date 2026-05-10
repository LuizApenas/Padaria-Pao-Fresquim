import { Router } from "express";

import {
  createCliente,
  deleteCliente,
  getClienteById,
  listClientes,
  updateCliente,
} from "../services/clienteService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const clientesRoutes = Router();

clientesRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const cliente = await createCliente(request.body);

    response.status(201).json(cliente);
  }),
);

clientesRoutes.get(
  "/",
  asyncHandler(async (_request, response) => {
    const clientes = await listClientes();

    response.status(200).json(clientes);
  }),
);

clientesRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const cliente = await getClienteById(request.params.id);

    response.status(200).json(cliente);
  }),
);

clientesRoutes.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const cliente = await updateCliente(request.params.id, request.body);

    response.status(200).json(cliente);
  }),
);

clientesRoutes.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    await deleteCliente(request.params.id);

    response.status(204).send();
  }),
);

export { clientesRoutes };
