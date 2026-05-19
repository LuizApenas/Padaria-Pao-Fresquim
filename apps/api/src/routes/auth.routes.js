import { Router } from "express";

import { ensureAuth } from "../middlewares/auth.js";
import { atualizarSenhaUsuario, loginFuncionario, solicitarRedefinicaoSenha } from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const authRoutes = Router();

authRoutes.post(
  "/login",
  asyncHandler(async (request, response) => {
    const auth = await loginFuncionario(request.body);

    response.status(200).json(auth);
  }),
);

authRoutes.get(
  "/me",
  ensureAuth,
  asyncHandler(async (request, response) => {
    response.status(200).json({ usuario: request.user });
  }),
);

authRoutes.post(
  "/password/recover",
  asyncHandler(async (request, response) => {
    const result = await solicitarRedefinicaoSenha(request.body);

    response.status(200).json(result);
  }),
);

authRoutes.post(
  "/password/update",
  asyncHandler(async (request, response) => {
    const result = await atualizarSenhaUsuario(request.body);

    response.status(200).json(result);
  }),
);

export { authRoutes };
