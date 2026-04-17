import dotenv from "dotenv";

import { createApp } from "./app.js";

// Carrega variáveis do arquivo .env antes de iniciar a aplicação.
dotenv.config();

// Monta a aplicação Express com middlewares e rotas.
const app = createApp();
// Usa a porta configurada no ambiente e cai para 3333 no desenvolvimento.
const port = Number(process.env.PORT ?? 3333);

// Inicia o servidor HTTP da API.
app.listen(port, () => {
  console.log(`API da Padaria Pão FresQUIM rodando na porta ${port}`);
});
