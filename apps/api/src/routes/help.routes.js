// apps/api/src/routes/help.routes.js
// Endpoint do assistente de Ajuda (Fresca Helper) — explica como usar o sistema.

import { Router } from "express";

import { ensureAuth } from "../middlewares/auth.js";
import { askHelp, getHelpPagesGlossary } from "../services/helpService.js";

export const helpRoutes = Router();

helpRoutes.use(ensureAuth);

helpRoutes.get("/glossario", (_request, response) => {
  response.status(200).json(getHelpPagesGlossary());
});

helpRoutes.post("/ask", async (request, response, next) => {
  try {
    const result = await askHelp({
      message: request.body?.message,
      page: request.body?.page,
    });
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
});
