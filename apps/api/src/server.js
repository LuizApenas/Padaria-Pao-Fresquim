import dotenv from "dotenv";

import { createApp } from "./app.js";
import { startDebtCron } from "./services/debtCronService.js";

// Carrega o .env da pasta da API, independentemente do diretório usado para iniciar o processo.
dotenv.config({ path: new URL("../.env", import.meta.url) });

// Monta a aplicacao Express com middlewares e rotas.
const app = createApp();
// Usa a porta configurada no ambiente e cai para 3333 no desenvolvimento.
const port = Number(process.env.PORT ?? 3333);

// Inicia o servidor HTTP da API.
app.listen(port, () => {
  console.log(`API da Padaria Pao Fresquim rodando na porta ${port}`);

  // Inicia o scheduler de cobranca diaria. Le horario/flag de chatbotSettings
  // a cada tick, entao mudancas no painel surtem efeito sem precisar reiniciar.
  startDebtCron();
});
