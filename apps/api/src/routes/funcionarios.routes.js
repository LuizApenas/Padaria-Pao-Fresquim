import { Router } from "express";

import {
  createFuncionario,
  deleteFuncionario,
  getFuncionarioById,
  listFuncionarios,
  updateFuncionario,
} from "../services/funcionarioService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureAuth, ensureRole } from "../middlewares/auth.js";

const funcionariosRoutes = Router();

funcionariosRoutes.use(ensureAuth, ensureRole("PROPRIETARIO"));

funcionariosRoutes.post(
  "/",
  asyncHandler(async (request, response) => {
    const funcionario = await createFuncionario(request.body);

    response.status(201).json(funcionario);
  }),
);

funcionariosRoutes.get(
  "/",
  asyncHandler(async (request, response) => {
    const funcionarios = await listFuncionarios(request.query);

    response.status(200).json(funcionarios);
  }),
);

funcionariosRoutes.get(
  "/:id",
  asyncHandler(async (request, response) => {
    const funcionario = await getFuncionarioById(request.params.id);

    response.status(200).json(funcionario);
  }),
);

funcionariosRoutes.put(
  "/:id",
  asyncHandler(async (request, response) => {
    const funcionario = await updateFuncionario(request.params.id, request.body);

    response.status(200).json(funcionario);
  }),
);

funcionariosRoutes.delete(
  "/:id",
  asyncHandler(async (request, response) => {
    await deleteFuncionario(request.params.id);

    response.status(204).send();
  }),
);

export { funcionariosRoutes };
