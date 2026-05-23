import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, timeout } from "rxjs/operators";
import { Debtor } from "../models";

import { API_BASE_URL } from "../config/api-base-url";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type FiadoResumo = {
  totalEmAberto: number;
  recuperadoNoMes: number;
  pagamentosCountMes: number;
  clientesInadimplentes: number;
  statusCarteira: "OK" | "ATENCAO" | "CRITICO";
  periodoMes: { inicio: string; fim: string };
};

export type PagamentoFiadoResponse = {
  conta: ContaFiadoApi;
  pagamento: {
    id: number;
    valor: number;
    dataPagamento: string;
    observacao: string | null;
    funcionarioId: number | null;
  };
};

type ContaFiadoApi = {
  clienteId: number;
  saldoDevedor: number;
  dataUltimaCobranca?: string | null;
  statusNotificacao?: string;
  cliente: {
    nome: string;
    telefone: string;
    vendas?: Array<{
      dataHora: string;
      itens?: Array<{
        subtotal: number | string;
        produto?: { nome?: string } | null;
      }>;
    }>;
  };
};

@Injectable({ providedIn: "root" })
export class FiadoApiService {
  private readonly http = inject(HttpClient);

  listDebtors(): Observable<Debtor[]> {
    return this.http
      .get<ContaFiadoApi[]>(`${API_BASE_URL}/api/fiado`, { headers: NO_CACHE_HEADERS })
      .pipe(
        timeout(15000),
        map((contas) => contas.map((conta) => this.normalizeDebtor(conta))),
      );
  }

  registerCharge(clientId: number): Observable<Debtor> {
    return this.http
      .post<ContaFiadoApi>(`${API_BASE_URL}/api/fiado/${clientId}/cobranca`, {})
      .pipe(map((conta) => this.normalizeDebtor(conta)));
  }

  getResumo(): Observable<FiadoResumo> {
    return this.http
      .get<FiadoResumo>(`${API_BASE_URL}/api/fiado/resumo`, { headers: NO_CACHE_HEADERS })
      .pipe(timeout(10000));
  }

  registerPayment(clientId: number, valor: number, observacao?: string): Observable<Debtor> {
    return this.http
      .post<PagamentoFiadoResponse>(`${API_BASE_URL}/api/fiado/${clientId}/pagamento`, {
        valor,
        observacao,
      })
      .pipe(
        timeout(10000),
        map((res) => this.normalizeDebtor(res.conta)),
      );
  }

  private normalizeDebtor(conta: ContaFiadoApi): Debtor {
    const lastSale = conta.cliente.vendas?.at(-1);
    const lastItem = lastSale?.itens?.at(-1);

    return {
      clientId: conta.clienteId,
      clientName: conta.cliente.nome,
      phone: conta.cliente.telefone,
      amount: Number(conta.saldoDevedor),
      overdue: conta.dataUltimaCobranca
        ? `Ultima cobranca em ${new Date(conta.dataUltimaCobranca).toLocaleDateString("pt-BR")}`
        : "Sem cobranca registrada",
      status: Number(conta.saldoDevedor) > 500 ? "Critico" : "Fiado ativo",
      lastPurchase: lastItem?.produto?.nome
        ? `${lastItem.produto.nome} em ${new Date(lastSale?.dataHora ?? "").toLocaleDateString("pt-BR")}`
        : "Sem compras vinculadas",
      lastInstallment: Number(lastItem?.subtotal ?? 0),
      statusNotificacao: conta.statusNotificacao ?? "NENHUMA",
    };
  }
}
