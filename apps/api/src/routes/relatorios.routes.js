import { Router } from "express";

import {
  getRelatorioDashboard,
  getRelatorioDevedores,
  getRelatorioVendas,
} from "../services/relatorioService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const relatoriosRoutes = Router();

relatoriosRoutes.get(
  "/vendas",
  asyncHandler(async (request, response) => {
    const relatorio = await getRelatorioVendas(request.query);

    response.status(200).json(relatorio);
  }),
);

relatoriosRoutes.get(
  "/devedores",
  asyncHandler(async (_request, response) => {
    const devedores = await getRelatorioDevedores();

    response.status(200).json(devedores);
  }),
);

relatoriosRoutes.get(
  "/dashboard",
  asyncHandler(async (_request, response) => {
    const dashboard = await getRelatorioDashboard();

    response.status(200).json(dashboard);
  }),
);

export { relatoriosRoutes };
