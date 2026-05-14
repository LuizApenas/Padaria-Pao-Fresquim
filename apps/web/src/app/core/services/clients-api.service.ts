import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Client } from "../models";

const API_BASE_URL = "http://localhost:3333";

@Injectable({ providedIn: "root" })
export class ClientsApiService {
  private readonly http = inject(HttpClient);

  listClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${API_BASE_URL}/clientes`);
  }
}
