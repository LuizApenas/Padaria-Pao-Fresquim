// apps/api/src/routes/clienteRoutes.js
import { Router } from "express";

import { clienteController } from "../controllers/clienteController.js";

// Este arquivo contem apenas as rotas de Cliente.
// Repita este padrao para cada nova entidade do domain.
const clienteRoutes = Router();

clienteRoutes.get("/", clienteController.index);
clienteRoutes.get("/:id", clienteController.show);
clienteRoutes.post("/", clienteController.store);
clienteRoutes.put("/:id", clienteController.update);
clienteRoutes.delete("/:id", clienteController.destroy);

export { clienteRoutes };
