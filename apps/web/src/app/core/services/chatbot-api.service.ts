import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { timeout } from "rxjs/operators";

const API_BASE_URL = "http://localhost:3333";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type ChatbotSettings = {
  evolutionApiUrl: string;
  evolutionApiKey: string;
  evolutionDispatchPath: string;
  webhookToken: string;
  ownerPhone: string;
  orderReadyNotificationsEnabled: boolean;
  debtWarningsEnabled: boolean;
  dailyMetricsEnabled: boolean;
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

@Injectable({ providedIn: "root" })
export class ChatbotApiService {
  private readonly http = inject(HttpClient);

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
}
