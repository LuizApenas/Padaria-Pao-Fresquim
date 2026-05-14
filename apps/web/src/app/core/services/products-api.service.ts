import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Product } from "../models";

const API_BASE_URL = "http://localhost:3333";

@Injectable({ providedIn: "root" })
export class ProductsApiService {
  private readonly http = inject(HttpClient);

  listProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${API_BASE_URL}/produtos`);
  }
}
