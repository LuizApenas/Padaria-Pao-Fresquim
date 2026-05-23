// apps/api/src/services/helpService.js
// Help/glossario via Groq: responde duvidas sobre como usar cada pagina do sistema.
// NAO acessa banco, NAO acessa dados de negocio. So orienta navegacao e fluxos.

import { AppError } from "../utils/AppError.js";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const MAX_QUESTION_LENGTH = 600;

// Mapa de glossarios curtos por pagina/rota. O LLM recebe o glossario relevante
// como contexto, o que evita alucinacao sobre features inexistentes.
const PAGE_GLOSSARY = {
  dashboard: [
    "Pagina inicial com indicadores: vendas do dia, ticket medio, pedidos pendentes, fiado em aberto.",
    "Use para visao geral rapida. Atalhos rapidos abrem PDV, novo cliente, novo produto.",
  ].join(" "),
  clientes: [
    "Cadastro e listagem de clientes. Permite criar, editar, buscar por nome/CPF/telefone.",
    "Bloqueia exclusao quando o cliente tem fiado em aberto.",
    "Status Serasa (regular/risco/protestado) e usado para liberar venda no fiado.",
  ].join(" "),
  produtos: [
    "Cadastro de produtos da padaria. Codigo de barras unico, preco base, categoria, imagem.",
    "Produto inativo nao aparece no PDV mas mantem historico. Use soft delete.",
  ].join(" "),
  funcionarios: [
    "Cadastro de funcionarios com cargo, matricula e role (Proprietario, Atendente, Padeiro).",
    "Aba Ponto digital registra entrada/saida. Aba Documentos faz upload de PDF para o Supabase.",
    "Atestados, licencas e ferias sao registrados aqui pelo Proprietario.",
  ].join(" "),
  "nova-venda": [
    "Tela do PDV. Busca produto por codigo de barras ou nome, adiciona itens, define quantidade.",
    "Pagamento: dinheiro, cartao ou fiado. Fiado exige cliente cadastrado e status Serasa OK.",
    "Confirmacao gera o ItemVenda com subtotal calculado automaticamente.",
  ].join(" "),
  historico: [
    "Lista todas as vendas concluidas com filtros por periodo, funcionario, cliente e status.",
    "Permite ver detalhes da venda (itens, valores, forma de pagamento) e cancelar venda se necessario.",
  ].join(" "),
  fiado: [
    "Gestao de contas em aberto. Mostra saldo devedor por cliente.",
    "Acoes: registrar cobranca, marcar como pago, enviar aviso de Serasa via WhatsApp (chatbot).",
  ].join(" "),
  relatorios: [
    "Relatorios diarios/semanais/mensais: total vendido, qtd de vendas, ticket medio, top produtos.",
    "Inclui lista de clientes inadimplentes e ranking de produtos mais vendidos.",
  ].join(" "),
  cameras: [
    "Visualizacao ao vivo das cameras de seguranca (centro de atendimento, balcao, producao).",
    "Cada feed e um stream MJPEG/HLS configurado pelo proprietario.",
  ].join(" "),
  chatbot: [
    "Painel da Fresca (assistente IA). Consulta vendas, fiado, pedidos via linguagem natural.",
    "Sugestoes rapidas no lado direito. Metricas diarias, semanais e mensais expandiveis.",
  ].join(" "),
  configuracoes: [
    "Configuracoes do chatbot: integracao Evolution (URL, API Key, Path — controladas por env),",
    "telefone do Sr. Joaquim, switch on/off do WhatsApp, avisos de pedido pronto, fiado, metricas.",
    "Fluxo chatbot mostra documentacao das rotas e do prompt vigente.",
  ].join(" "),
};

function buildHelpSystemPrompt(pageContext) {
  const pageGlossary = pageContext ? PAGE_GLOSSARY[pageContext] : null;

  return [
    "Voce e a Fresca em modo Ajuda: explica como usar o sistema da Padaria Pao FresQUIM.",
    "Sua resposta deve ser CURTA (no maximo 4 paragrafos curtos), objetiva e em portugues do Brasil.",
    "Tom: amigavel, claro, sem jargao. Use bullets quando ajudar.",
    "Nao invente funcionalidades que nao estao no glossario. Se nao souber, sugira procurar a equipe de suporte ou perguntar de outro jeito.",
    "Nao revele detalhes tecnicos (backend, Prisma, Supabase, banco, codigo, chaves). Foque no que o usuario VE e CLICA.",
    "Voce nao tem acesso aos dados reais (vendas, clientes, produtos). So orienta como navegar e usar as telas. Se pedirem dado real, oriente a abrir a tela correspondente.",
    "",
    pageContext
      ? `Pagina atual do usuario: ${pageContext}.`
      : "Pagina atual do usuario: nao identificada.",
    pageGlossary
      ? `Glossario desta pagina: ${pageGlossary}`
      : "Glossario: o usuario nao esta em uma pagina mapeada, responda de forma geral sobre o sistema.",
    "",
    "Paginas disponiveis no sistema:",
    "- dashboard (visao geral)",
    "- clientes, produtos, funcionarios (cadastros)",
    "- nova-venda (PDV)",
    "- historico (vendas concluidas)",
    "- fiado (contas em aberto)",
    "- relatorios (diario/semanal/mensal)",
    "- cameras (monitoramento)",
    "- chatbot (Fresca consultiva)",
    "- configuracoes (chatbot + integracoes)",
  ].join("\n");
}

export async function askHelp({ message, page }) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new AppError("Help indisponivel: GROQ_API_KEY nao configurada.", 503);
  }

  const trimmed = String(message ?? "").trim();
  if (!trimmed) {
    throw new AppError("Pergunta vazia.", 400);
  }
  if (trimmed.length > MAX_QUESTION_LENGTH) {
    throw new AppError("Pergunta muito longa.", 413);
  }

  const pageContext = typeof page === "string" ? page.trim().toLowerCase() : "";
  const systemPrompt = buildHelpSystemPrompt(pageContext);

  const response = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_AI_MODEL || process.env.GROQ_MODEL || DEFAULT_MODEL,
      temperature: 0.3,
      max_completion_tokens: 500,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: trimmed },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new AppError(`Falha no Help (Groq): ${response.status} ${body || response.statusText}`, 422);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content?.trim() ?? "";

  if (!reply) {
    throw new AppError("Resposta vazia do assistente de Help.", 422);
  }

  return {
    reply,
    page: pageContext || null,
  };
}

export function getHelpPagesGlossary() {
  return PAGE_GLOSSARY;
}
