import { Injectable } from "@angular/core";
import { initialChat, initialSales, initialSettings, products as initialProducts } from "../mock-data";
import { ChatMessage, Product, Sale, SettingItem } from "../models";

const SALES_KEY = "pao-fresquim-sales";
const SETTINGS_KEY = "pao-fresquim-settings";
const CHAT_KEY = "pao-fresquim-chat";
const PRODUCTS_KEY = "pao-fresquim-products";

@Injectable({ providedIn: "root" })
export class StorageService {
  private readJson<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private writeJson(key: string, value: unknown): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  getSales(): Sale[] {
    const sales = this.readJson<Sale[] | null>(SALES_KEY, null);
    if (sales) {
      return sales;
    }
    this.writeJson(SALES_KEY, initialSales);
    return initialSales;
  }

  appendSale(sale: Sale): Sale[] {
    const sales = [sale, ...this.getSales()];
    this.writeJson(SALES_KEY, sales);
    return sales;
  }

  getSettings(): SettingItem[] {
    const settings = this.readJson<SettingItem[] | null>(SETTINGS_KEY, null);
    if (settings) {
      return settings;
    }
    this.writeJson(SETTINGS_KEY, initialSettings);
    return initialSettings;
  }

  saveSettings(settings: SettingItem[]): void {
    this.writeJson(SETTINGS_KEY, settings);
  }

  getChatMessages(): ChatMessage[] {
    const chat = this.readJson<ChatMessage[] | null>(CHAT_KEY, null);
    if (chat) {
      return chat;
    }
    this.writeJson(CHAT_KEY, initialChat);
    return initialChat;
  }

  saveChatMessages(messages: ChatMessage[]): void {
    this.writeJson(CHAT_KEY, messages);
  }

  getProducts(): Product[] {
    const products = this.readJson<Product[] | null>(PRODUCTS_KEY, null);
    if (products) {
      return products.map((product) => this.normalizeProduct(product));
    }
    const normalizedProducts = initialProducts.map((product) => this.normalizeProduct(product));
    this.writeJson(PRODUCTS_KEY, normalizedProducts);
    return normalizedProducts;
  }

  saveProducts(products: Product[]): void {
    this.writeJson(PRODUCTS_KEY, products.map((product) => this.normalizeProduct(product)));
  }

  upsertProduct(product: Product): Product[] {
    const products = this.getProducts();
    const normalizedProduct = this.normalizeProduct(product);
    const existingIndex = products.findIndex((item) => item.id === normalizedProduct.id);

    if (existingIndex >= 0) {
      products[existingIndex] = normalizedProduct;
    } else {
      products.unshift(normalizedProduct);
    }

    this.saveProducts(products);
    return products;
  }

  deleteProduct(productId: number): Product[] {
    const products = this.getProducts().filter((product) => product.id !== productId);
    this.saveProducts(products);
    return products;
  }

  private normalizeProduct(product: Product): Product {
    const nome = product.nome ?? product.name ?? "";
    const categoria = product.categoria ?? product.category ?? "Paes";
    const codigoBarras = product.codigoBarras ?? product.sku ?? "";
    const precoBase = Number(product.precoBase ?? product.price ?? 0);

    return {
      ...product,
      nome,
      categoria,
      codigoBarras,
      precoBase,
      imagemUrl: product.imagemUrl ?? null,
      name: nome,
      category: categoria,
      sku: codigoBarras,
      stock: Number(product.stock ?? 0),
      unit: product.unit ?? "un",
      price: precoBase,
    };
  }
}
