import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Client } from "../models";

const API_BASE_URL = "http://localhost:3333";

@Injectable({ providedIn: "root" })
export class ClientsApiService {
  private readonly http = inject(HttpClient);

  listClients(): Observable<Client[]> {
    return this.http
      .get<Client[]>(`${API_BASE_URL}/clientes`)
      .pipe(map((clients) => clients.map((client) => this.normalizeClient(client))));
  }

  createClient(client: Client): Observable<Client> {
    return this.http
      .post<Client>(`${API_BASE_URL}/clientes`, this.toClientePayload(client))
      .pipe(map((createdClient) => this.normalizeClient(createdClient)));
  }

  updateClient(client: Client): Observable<Client> {
    return this.http
      .put<Client>(`${API_BASE_URL}/clientes/${client.id}`, this.toClientePayload(client))
      .pipe(map((updatedClient) => this.normalizeClient(updatedClient)));
  }

  deleteClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/clientes/${clientId}`);
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
