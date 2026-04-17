import { Router } from "express";

// Router principal da API. Conforme o projeto crescer, outras rotas serão acopladas aqui.
const router = Router();

// Endpoint mínimo para verificar se a API subiu corretamente.
router.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "padaria-api",
  });
});

export { router };
