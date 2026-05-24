// apps/api/src/routes/chatbot.routes.js
// Rotas HTTP do chatbot: webhook Evolution (sem JWT), operacoes autenticadas e documentacao do fluxo.

import { Router } from "express";

import { ensureAuth, ensureRole } from "../middlewares/auth.js";
import {
  avisarPedidoPronto,
  consultarClienteChatbot,
  consultarPedidoChatbot,
  criarPedidoChatbot,
  enviarAvisoSerasaFiado,
  getMetricasDiariasChatbot,
  getMetricasPeriodoChatbot,
  getChatbotDocumentacao,
  handleEvolutionWebhook,
  responderMensagemChatbot,
} from "../services/chatbotService.js";
import { getChatbotSettings, updateChatbotSettings } from "../services/chatbotSettingsService.js";
import { dispatchWhatsAppText } from "../services/evolutionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const chatbotRoutes = Router();

// Rotas publicas chamadas diretamente pela Evolution (sem JWT de usuario).
chatbotRoutes.post(
  "/webhook/evolution",
  asyncHandler(async (request, response) => {
    const result = await handleEvolutionWebhook(request.body);

    response.status(200).json(result);
  }),
);

chatbotRoutes.post(
  "/clientes/consultar",
  asyncHandler(async (request, response) => {
    const cliente = await consultarClienteChatbot(request.body);

    response.status(200).json(cliente);
  }),
);

chatbotRoutes.post(
  "/pedidos",
  asyncHandler(async (request, response) => {
    const pedido = await criarPedidoChatbot(request.body);

    response.status(201).json(pedido);
  }),
);

chatbotRoutes.post(
  "/pedidos/:id/consultar",
  asyncHandler(async (request, response) => {
    const pedido = await consultarPedidoChatbot(request.params.id, request.body);

    response.status(200).json(pedido);
  }),
);

chatbotRoutes.use(ensureAuth);

// Documentacao do fluxo e system prompt (somente leitura, sem segredos).
chatbotRoutes.get(
  "/documentacao",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (_request, response) => {
    response.status(200).json(await getChatbotDocumentacao());
  }),
);

chatbotRoutes.get(
  "/configuracoes",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (_request, response) => {
    const settings = await getChatbotSettings();

    response.status(200).json(settings);
  }),
);

chatbotRoutes.put(
  "/configuracoes",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const settings = await updateChatbotSettings(request.body);

    response.status(200).json(settings);
  }),
);

chatbotRoutes.post(
  "/evolution/teste",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const settings = await getChatbotSettings();
    const phone = request.body?.phone || settings.ownerPhone;
    const message =
      request.body?.message ||
      "Teste de integracao Evolution - Padaria Pao Fresquim.";

    const result = await dispatchWhatsAppText({ phone, message });

    response.status(200).json(result);
  }),
);

chatbotRoutes.post(
  "/pedidos/:id/pronto",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const result = await avisarPedidoPronto(request.params.id);

    response.status(200).json(result);
  }),
);

chatbotRoutes.post(
  "/fiado/:clienteId/aviso-serasa",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const result = await enviarAvisoSerasaFiado(request.params.clienteId);

    response.status(200).json(result);
  }),
);

chatbotRoutes.get(
  "/metricas/diarias",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (_request, response) => {
    const metrics = await getMetricasDiariasChatbot();

    response.status(200).json(metrics);
  }),
);

chatbotRoutes.get(
  "/metricas/periodo",
  ensureRole("PROPRIETARIO"),
  asyncHandler(async (request, response) => {
    const metrics = await getMetricasPeriodoChatbot({
      dataInicio: request.query.dataInicio,
      dataFim: request.query.dataFim,
    });

    response.status(200).json(metrics);
  }),
);

// Chat do painel administrativo com contexto do funcionario autenticado.
chatbotRoutes.post(
  "/mensagens",
  ensureRole("PROPRIETARIO", "ATENDENTE"),
  asyncHandler(async (request, response) => {
    const result = await responderMensagemChatbot(request.body, {
      requester: request.user,
      channel: "FRONTEND",
    });

    response.status(200).json(result);
  }),
);

export { chatbotRoutes };
