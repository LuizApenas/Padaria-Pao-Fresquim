import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { router } from "./routes/index.js";

export function createApp() {
  // Cria a instância central do Express que será usada pelo servidor.
  const app = express();

  // Middleware de segurança com headers HTTP básicos.
  app.use(helmet());
  // Libera o consumo da API por outros domínios durante o desenvolvimento.
  app.use(cors());
  // Habilita leitura de JSON no corpo das requisições.
  app.use(express.json());
  // Registra logs HTTP no terminal para facilitar depuração.
  app.use(morgan("dev"));

  // Concentra todas as rotas da aplicação em um único ponto de entrada.
  app.use(router);

  return app;
}
