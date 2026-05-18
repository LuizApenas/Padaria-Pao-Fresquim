import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { timeout } from "rxjs/operators";

const API_BASE_URL = "http://localhost:3333";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type DailySalesReport = {
  date: string;
  day: string;
  value: number;
  orders: number;
};

export type TopProductReport = {
  id: number;
  name: string;
  sales: number;
  revenue: number;
};

export type SalesReport = {
  totalSold: number;
  totalOrders: number;
  averageTicket: number;
  dailySales: DailySalesReport[];
  topProducts: TopProductReport[];
};

export type DashboardReport = {
  totalSoldToday: number;
  salesCount: number;
  averageTicket: number;
  debtClients: number;
  comparedToYesterday: number;
};

export type DebtorReport = {
  clienteId: number;
  nome: string;
  telefone: string;
  totalDevido: number;
  statusNotificacao: string;
  produtosComprados: Array<{
    data: string;
    produto: string;
    quantidade: number;
    subtotal: number;
  }>;
};

@Injectable({ providedIn: "root" })
export class ReportsApiService {
  private readonly http = inject(HttpClient);

  getSalesReport(params: { dataInicio?: string; dataFim?: string; produtoId?: string } = {}): Observable<SalesReport> {
    return this.http
      .get<SalesReport>(`${API_BASE_URL}/api/relatorios/vendas`, {
        headers: NO_CACHE_HEADERS,
        params: {
          dataInicio: params.dataInicio ?? "",
          dataFim: params.dataFim ?? "",
          produtoId: params.produtoId ?? "",
        },
      })
      .pipe(timeout(8000));
  }

  getDashboardReport(): Observable<DashboardReport> {
    return this.http
      .get<DashboardReport>(`${API_BASE_URL}/api/relatorios/dashboard`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(8000));
  }

  getDebtorsReport(): Observable<DebtorReport[]> {
    return this.http
      .get<DebtorReport[]>(`${API_BASE_URL}/api/relatorios/devedores`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(8000));
  }
}
