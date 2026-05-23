import { Router } from "express";

import {
  createContaFiado,
  deleteContaFiado,
  getContaFiadoByClienteId,
  getResumoFiado,
  listContasFiado,
  listPagamentosFiadoCliente,
  registrarCobrancaFiado,
  registrarPagamentoFiado,
  updateContaFiado,
} from "../services/fiadoService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureAuth, ensureRole } from "../middlewares/auth.js";

const fiadoRoutes = Router();

fiadoRoutes.use(ensureAuth);

fiadoRoutes.get(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (_request, response) => {
    const contas = await listContasFiado();

    response.status(200).json(contas);
  }),
);

fiadoRoutes.get(
  "/resumo",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (_request, response) => {
    const resumo = await getResumoFiado();

    response.status(200).json(resumo);
  }),
);

fiadoRoutes.get(
  "/:clienteId/pagamentos",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const pagamentos = await listPagamentosFiadoCliente(request.params.clienteId);

    response.status(200).json(pagamentos);
  }),
);

fiadoRoutes.post(
  "/:clienteId/pagamento",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const result = await registrarPagamentoFiado(request.params.clienteId, {
      ...request.body,
      funcionarioId: request.user?.id ?? request.body?.funcionarioId,
    });

    response.status(201).json(result);
  }),
);

fiadoRoutes.post(
  "/",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const conta = await createContaFiado(request.body);

    response.status(201).json(conta);
  }),
);

fiadoRoutes.get(
  "/:clienteId",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const conta = await getContaFiadoByClienteId(request.params.clienteId);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.put(
  "/:clienteId",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const conta = await updateContaFiado(request.params.clienteId, request.body);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.post(
  "/:clienteId/cobranca",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const conta = await registrarCobrancaFiado(request.params.clienteId);

    response.status(200).json(conta);
  }),
);

fiadoRoutes.delete(
  "/:clienteId",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    await deleteContaFiado(request.params.clienteId);

    response.status(204).send();
  }),
);

export { fiadoRoutes };
