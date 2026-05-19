import { Router } from "express";

import {
  createFuncionario,
  deleteFuncionario,
  getFuncionarioById,
  listFuncionarios,
  updateFuncionario,
} from "../services/funcionarioService.js";
import {
  gerarDadosOperacionaisFake,
  listarPonto,
  registrarAtestado,
  registrarFerias,
  registrarLicenca,
  registrarPonto,
} from "../services/funcionarioOperacionalService.js";
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

funcionariosRoutes.post(
  "/:id/ponto",
  asyncHandler(async (request, response) => {
    const registro = await registrarPonto(request.params.id, request.body);

    response.status(201).json(registro);
  }),
);

funcionariosRoutes.get(
  "/:id/ponto",
  asyncHandler(async (request, response) => {
    const registros = await listarPonto(request.params.id, request.query);

    response.status(200).json(registros);
  }),
);

funcionariosRoutes.post(
  "/:id/ferias",
  asyncHandler(async (request, response) => {
    const ferias = await registrarFerias(request.params.id, request.body);

    response.status(201).json(ferias);
  }),
);

funcionariosRoutes.post(
  "/:id/licencas",
  asyncHandler(async (request, response) => {
    const licenca = await registrarLicenca(request.params.id, request.body);

    response.status(201).json(licenca);
  }),
);

funcionariosRoutes.post(
  "/:id/atestados",
  asyncHandler(async (request, response) => {
    const atestado = await registrarAtestado(request.params.id, request.body);

    response.status(201).json(atestado);
  }),
);

funcionariosRoutes.post(
  "/:id/dados-operacionais/fake",
  asyncHandler(async (request, response) => {
    const dados = await gerarDadosOperacionaisFake(request.params.id);

    response.status(201).json(dados);
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
