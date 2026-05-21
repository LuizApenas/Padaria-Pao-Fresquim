import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { timeout } from "rxjs/operators";

import { API_BASE_URL } from "../config/api-base-url";

export { API_BASE_URL };
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type ChatbotSettings = {
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionDispatchPath: string;
  ownerPhone: string;
  orderReadyNotificationsEnabled: boolean;
  debtWarningsEnabled: boolean;
  dailyMetricsEnabled: boolean;
  messageBufferMs: number;
};

export type ChatbotDailyMetrics = {
  totalSoldToday: number;
  salesCount: number;
  averageTicket: number;
  debtClients: number;
  comparedToYesterday: number;
  pedidosPendentes: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
};

export type ChatbotPeriodMetrics = {
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  totalSold: number;
  salesCount: number;
  averageTicket: number;
  debtClients: number;
  comparedToYesterday: number;
  pedidosPendentes: number;
  topProducts: Array<{ name: string; sales: number; revenue: number }>;
};

export type ChatbotDocumentacao = {
  version: string;
  systemPrompt: string;
  systemPromptNote: string;
  rules: string[];
  flowSteps: string[];
  intents: string[];
  workerTools: string[];
  channels: string[];
  groqModel: string;
};

export type ChatbotMessageResponse = {
  source: "groq" | "rules" | "guardrail";
  intent: string;
  reply: string;
  pedido?: {
    clienteId: number;
    cliente: string;
    status: string;
    valorEstimado: number;
    itens: Array<{
      produtoId: number;
      produto: string;
      quantidade: number;
      subtotal: number;
    }>;
  };
};

@Injectable({ providedIn: "root" })
export class ChatbotApiService {
  private readonly http = inject(HttpClient);

  getDocumentacao(): Observable<ChatbotDocumentacao> {
    return this.http
      .get<ChatbotDocumentacao>(`${API_BASE_URL}/api/chatbot/documentacao`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(8000));
  }

  getSettings(): Observable<ChatbotSettings> {
    return this.http
      .get<ChatbotSettings>(`${API_BASE_URL}/api/chatbot/configuracoes`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(8000));
  }

  updateSettings(settings: ChatbotSettings): Observable<ChatbotSettings> {
    return this.http.put<ChatbotSettings>(`${API_BASE_URL}/api/chatbot/configuracoes`, settings);
  }

  getDailyMetrics(): Observable<ChatbotDailyMetrics> {
    return this.http
      .get<ChatbotDailyMetrics>(`${API_BASE_URL}/api/chatbot/metricas/diarias`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(8000));
  }

  getPeriodMetrics(dataInicio: string, dataFim: string): Observable<ChatbotPeriodMetrics> {
    return this.http
      .get<ChatbotPeriodMetrics>(`${API_BASE_URL}/api/chatbot/metricas/periodo`, {
        headers: NO_CACHE_HEADERS,
        params: { dataInicio, dataFim },
      })
      .pipe(timeout(12000));
  }

  sendMessage(payload: {
    message: string;
    messages?: Array<{ role: "assistant" | "user"; message: string }>;
    telefone?: string;
    cpf?: string;
  }): Observable<ChatbotMessageResponse> {
    return this.http
      .post<ChatbotMessageResponse>(`${API_BASE_URL}/api/chatbot/mensagens`, payload)
      .pipe(timeout(20000));
  }

  sendTestMessage(payload: { phone?: string; message?: string }): Observable<unknown> {
    return this.http.post(`${API_BASE_URL}/api/chatbot/evolution/teste`, payload).pipe(timeout(15000));
  }
}
