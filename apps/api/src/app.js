import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middlewares/errorHandler.js";
import { router } from "./routes/index.js";

export function createApp() {
  // Cria a instância central do Express que será usada pelo servidor.
  const app = express();

  // Middleware de segurança com headers HTTP básicos.
  app.use(helmet());
  const corsOrigin = process.env.CORS_ORIGIN?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigin?.length ? corsOrigin : true,
      credentials: true,
    }),
  );
  // Habilita leitura de JSON no corpo das requisições.
  app.use(express.json());
  // Registra logs HTTP no terminal para facilitar depuração.
  app.use(morgan("dev"));
  app.use((_request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
  });

  // Concentra todas as rotas da aplicação em um único ponto de entrada.
  app.use("/api", router);
  app.use(router);
  // Registra o tratamento global de erros como último middleware da aplicação.
  app.use(errorHandler);

  return app;
}
