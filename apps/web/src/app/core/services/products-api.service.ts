import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Product } from "../models";

import { API_BASE_URL } from "../config/api-base-url";

export type PaginatedProductsResponse = {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable({ providedIn: "root" })
export class ProductsApiService {
  private readonly http = inject(HttpClient);

  listProducts(): Observable<Product[]> {
    return this.listProductsPage({ limit: 100 }).pipe(map((response) => response.data));
  }

  listProductsPage(params: { busca?: string; categoria?: string; page?: number; limit?: number } = {}): Observable<PaginatedProductsResponse> {
    return this.http
      .get<PaginatedProductsResponse>(`${API_BASE_URL}/api/produtos`, {
        params: {
          busca: params.busca ?? "",
          categoria: params.categoria ?? "",
          page: String(params.page ?? 1),
          limit: String(params.limit ?? 10),
        },
      })
      .pipe(map((response) => ({
        ...response,
        data: response.data.map((product) => this.normalizeProduct(product)),
      })));
  }

  listCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${API_BASE_URL}/api/produtos/categorias`);
  }

  getByBarcode(codigoBarras: string): Observable<Product> {
    return this.http
      .get<Product>(`${API_BASE_URL}/api/produtos/codigo/${encodeURIComponent(codigoBarras)}`)
      .pipe(map((product) => this.normalizeProduct(product)));
  }

  createProduct(product: Product): Observable<Product> {
    return this.http
      .post<Product>(`${API_BASE_URL}/api/produtos`, this.toProdutoPayload(product))
      .pipe(map((createdProduct) => this.normalizeProduct(createdProduct)));
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http
      .put<Product>(`${API_BASE_URL}/api/produtos/${product.id}`, this.toProdutoPayload(product))
      .pipe(map((updatedProduct) => this.normalizeProduct(updatedProduct)));
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/api/produtos/${productId}`);
  }

  normalizeProduct(product: Product): Product {
    const nome = product.nome ?? product.name;
    const categoria = product.categoria ?? product.category;
    const codigoBarras = product.codigoBarras ?? product.sku;
    const precoBase = product.precoBase ?? product.price;

    return {
      ...product,
      nome,
      categoria,
      codigoBarras,
      precoBase,
      name: nome,
      category: categoria,
      sku: codigoBarras,
      price: Number(precoBase),
      stock: product.stock ?? 0,
      unit: product.unit ?? "un",
      imagemUrl: product.imagemUrl ?? null,
    };
  }

  private toProdutoPayload(product: Product) {
    return {
      codigoBarras: product.codigoBarras ?? product.sku,
      nome: product.nome ?? product.name,
      categoria: product.categoria ?? product.category,
      precoBase: product.precoBase ?? product.price,
      imagemUrl: product.imagemUrl ?? null,
    };
  }
}
