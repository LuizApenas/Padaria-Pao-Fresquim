import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, timeout } from "rxjs/operators";
import { CreateSalePayload, Sale } from "../models";

import { API_BASE_URL } from "../config/api-base-url";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type SalesListResponse = {
  data: Sale[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary: {
    totalSold: number;
    averageTicket: number;
    canceledSales: number;
    activeOperators: number;
  };
};

@Injectable({ providedIn: "root" })
export class SalesApiService {
  private readonly http = inject(HttpClient);

  listSales(params: { inicio?: string; fim?: string; funcionarioId?: string; page?: number; limit?: number } = {}): Observable<SalesListResponse> {
    return this.http
      .get<SalesListResponse>(`${API_BASE_URL}/api/vendas`, {
        headers: NO_CACHE_HEADERS,
        params: {
          inicio: params.inicio ?? "",
          fim: params.fim ?? "",
          funcionarioId: params.funcionarioId ?? "",
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 10),
        },
      })
      .pipe(
        timeout(8000),
        map((response) => ({
          ...response,
          data: response.data.map((sale) => this.normalizeSale(sale)),
        })),
      );
  }

  createSale(payload: CreateSalePayload): Observable<unknown> {
    return this.http.post<unknown>(`${API_BASE_URL}/api/vendas`, payload).pipe(timeout(10000));
  }

  cancelSale(saleId: number | string): Observable<Sale> {
    return this.http
      .patch<Sale>(`${API_BASE_URL}/api/vendas/${saleId}/cancelar`, {})
      .pipe(timeout(10000), map((sale) => this.normalizeSale(sale)));
  }

  markOrderReady(saleId: number | string): Observable<{ pedidoId: number; status: string; dispatch: unknown }> {
    return this.http
      .post<{ pedidoId: number; status: string; dispatch: unknown }>(`${API_BASE_URL}/api/chatbot/pedidos/${saleId}/pronto`, {})
      .pipe(timeout(15000));
  }

  normalizeSale(sale: Sale): Sale {
    const value = Number(sale.valorTotal ?? sale.value ?? 0);
    const productNames = sale.itens
      ?.map((item) => item.produto?.nome ?? item.produto?.name)
      .filter(Boolean)
      .join(", ");

    return {
      ...sale,
      id: String(sale.id),
      datetime: sale.datetime ?? this.formatDateTime(sale.dataHora),
      client: sale.client ?? sale.cliente?.nome ?? sale.cliente?.name ?? "Cliente nao informado",
      mainProduct: sale.mainProduct ?? productNames ?? "Itens nao informados",
      payment: sale.payment ?? sale.formaPagamento ?? "Nao informado",
      value,
      status: sale.status ?? "PENDENTE",
    };
  }

  private formatDateTime(date?: string): string {
    if (!date) {
      return "Nao informado";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(date));
  }
}
