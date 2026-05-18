import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { map, timeout } from "rxjs/operators";
import { Client } from "../models";

const API_BASE_URL = "http://localhost:3333";
const NO_CACHE_HEADERS = new HttpHeaders({
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
});

export type PaginatedClientsResponse = {
  data: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable({ providedIn: "root" })
export class ClientsApiService {
  private readonly http = inject(HttpClient);

  listClients(): Observable<Client[]> {
    return this.listClientsPage({ limit: 100 }).pipe(map((response) => response.data));
  }

  listClientsPage(params: { busca?: string; page?: number; limit?: number } = {}): Observable<PaginatedClientsResponse> {
    return this.http
      .get<PaginatedClientsResponse>(`${API_BASE_URL}/api/clientes`, {
        headers: NO_CACHE_HEADERS,
        params: {
          busca: params.busca ?? "",
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 10),
        },
      })
      .pipe(
        timeout(8000),
        map((response) => ({
          ...response,
          data: response.data.map((client) => this.normalizeClient(client)),
        })),
      );
  }

  createClient(client: Client): Observable<Client> {
    return this.http
      .post<Client>(`${API_BASE_URL}/api/clientes`, this.toClientePayload(client))
      .pipe(map((createdClient) => this.normalizeClient(createdClient)));
  }

  updateClient(client: Client): Observable<Client> {
    return this.http
      .put<Client>(`${API_BASE_URL}/api/clientes/${client.id}`, this.toClientePayload(client))
      .pipe(map((updatedClient) => this.normalizeClient(updatedClient)));
  }

  deleteClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/clientes/${clientId}`);
  }

  normalizeClient(client: Client): Client {
    const nome = client.nome ?? client.name;
    const telefone = client.telefone ?? client.phone;
    const endereco = client.endereco ?? client.address;
    const statusSerasa = client.statusSerasa ?? client.status;

    return {
      ...client,
      nome,
      telefone,
      endereco,
      statusSerasa,
      name: nome,
      phone: telefone,
      address: endereco,
      status: client.status ?? statusSerasa ?? "Ativo",
      debtStatus: client.debtStatus ?? (client.contaFiado ? "Fiado ativo" : "Em dia"),
      ticket: Number(client.ticket ?? 0),
      initials: client.initials ?? this.getInitials(nome),
    };
  }

  private toClientePayload(client: Client) {
    return {
      nome: client.nome ?? client.name,
      telefone: client.telefone ?? client.phone,
      endereco: client.endereco ?? client.address,
      cpf: client.cpf,
      statusSerasa: client.statusSerasa ?? client.status,
    };
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
}
