import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { CreateSalePayload } from "../models";

const API_BASE_URL = "http://localhost:3333";

@Injectable({ providedIn: "root" })
export class SalesApiService {
  private readonly http = inject(HttpClient);

  createSale(payload: CreateSalePayload): Observable<unknown> {
    return this.http.post<unknown>(`${API_BASE_URL}/vendas`, payload);
  }
}
