import { Router } from "express";

import { clientesRoutes } from "./clientes.routes.js";
import { funcionariosRoutes } from "./funcionarios.routes.js";
import { produtosRoutes } from "./produtos.routes.js";
import { vendasRoutes } from "./vendas.routes.js";

// Router principal da API. Conforme o projeto crescer, outras rotas serão acopladas aqui.
const router = Router();

// Endpoint mínimo para verificar se a API subiu corretamente.
router.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "padaria-api",
  });
});

router.use("/clientes", clientesRoutes);
router.use("/produtos", produtosRoutes);
router.use("/funcionarios", funcionariosRoutes);
router.use("/vendas", vendasRoutes);

export { router };
