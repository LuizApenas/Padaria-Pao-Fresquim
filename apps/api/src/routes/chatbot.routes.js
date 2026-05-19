import { Router } from "express";

import { ensureAuth, ensureRole } from "../middlewares/auth.js";
import { ensureEvolutionWebhook } from "../middlewares/evolutionWebhook.js";
import {
  avisarPedidoPronto,
  consultarClienteChatbot,
  consultarPedidoChatbot,
  criarPedidoChatbot,
  enviarAvisoSerasaFiado,
  getMetricasDiariasChatbot,
  handleEvolutionWebhook,
} from "../services/chatbotService.js";
import { getChatbotSettings, updateChatbotSettings } from "../services/chatbotSettingsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const chatbotRoutes = Router();

chatbotRoutes.post(
  "/webhook/evolution",
  ensureEvolutionWebhook,
  asyncHandler(async (request, response) => {
    const result = await handleEvolutionWebhook(request.body);

    response.status(200).json(result);
  }),
);

chatbotRoutes.post(
  "/clientes/consultar",
  ensureEvolutionWebhook,
  asyncHandler(async (request, response) => {
    const cliente = await consultarClienteChatbot(request.body);

    response.status(200).json(cliente);
  }),
);

chatbotRoutes.post(
  "/pedidos",
  ensureEvolutionWebhook,
  asyncHandler(async (request, response) => {
    const pedido = await criarPedidoChatbot(request.body);

    response.status(201).json(pedido);
  }),
);

chatbotRoutes.post(
  "/pedidos/:id/consultar",
  ensureEvolutionWebhook,
  asyncHandler(async (request, response) => {
    const pedido = await consultarPedidoChatbot(request.params.id, request.body);

    response.status(200).json(pedido);
  }),
);

chatbotRoutes.use(ensureAuth);

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

export { chatbotRoutes };
