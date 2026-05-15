import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Product } from "../models";

const API_BASE_URL = "http://localhost:3333";

@Injectable({ providedIn: "root" })
export class ProductsApiService {
  private readonly http = inject(HttpClient);

  listProducts(): Observable<Product[]> {
    return this.http
      .get<Product[]>(`${API_BASE_URL}/produtos`)
      .pipe(map((products) => products.map((product) => this.normalizeProduct(product))));
  }

  listCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${API_BASE_URL}/produtos/categorias`);
  }

  getByBarcode(codigoBarras: string): Observable<Product> {
    return this.http
      .get<Product>(`${API_BASE_URL}/produtos/codigo/${encodeURIComponent(codigoBarras)}`)
      .pipe(map((product) => this.normalizeProduct(product)));
  }

  createProduct(product: Product): Observable<Product> {
    return this.http
      .post<Product>(`${API_BASE_URL}/produtos`, this.toProdutoPayload(product))
      .pipe(map((createdProduct) => this.normalizeProduct(createdProduct)));
  }

  updateProduct(product: Product): Observable<Product> {
    return this.http
      .put<Product>(`${API_BASE_URL}/produtos/${product.id}`, this.toProdutoPayload(product))
      .pipe(map((updatedProduct) => this.normalizeProduct(updatedProduct)));
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/produtos/${productId}`);
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
