import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { clients as mockClients, products as mockProducts } from "../../core/mock-data";
import { StorageService } from "../../core/services/storage.service";
import { Client, Product } from "../../core/models";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { ProductsApiService } from "../../core/services/products-api.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-sale",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./sale.component.html",
  styleUrl: "./sale.component.css"
})
export class SaleComponent implements OnInit {
  search = "";
  selectedClientId = "";
  payment = "PIX";
  discount = 0;
  cart: Array<{ id: number; name: string; price: number; quantity: number }> = [];
  clients: Client[] = [];
  products: Product[] = [];
  isLoading = true;
  errorMessage = "";
  isUsingFallbackData = false;
  fallbackMessage = "";
  readonly canPersistSaleToApi = false;

  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly storageService: StorageService,
    private readonly router: Router,
    private readonly clientsApiService: ClientsApiService,
    private readonly productsApiService: ProductsApiService,
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  get catalog() {
    const normalized = this.search.toLowerCase();
    return this.products
      .filter((product) => product.name.toLowerCase().includes(normalized) || product.sku.includes(this.search))
      .slice(0, 6);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  retry(): void {
    this.loadDependencies();
  }

  addProduct(product: Product): void {
    const existing = this.cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
      return;
    }
    this.cart = [...this.cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }];
  }

  updateQuantity(id: number, delta: number): void {
    this.cart = this.cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
    );
  }

  removeItem(id: number): void {
    this.cart = this.cart.filter((item) => item.id !== id);
  }

  finalizeSale(): void {
    if (!this.cart.length) {
      return;
    }

    const client = this.clients.find((item) => item.id === Number(this.selectedClientId));
    const currentSales = this.storageService.getSales();
    this.storageService.appendSale({
      id: `#VEN-${9403 + currentSales.length}`,
      datetime: "Agora mesmo",
      client: client ? client.name : "Cliente balcao",
      mainProduct: this.cart[0].name,
      payment: this.payment,
      value: Math.max(this.subtotal - this.discount, 0),
      status: this.payment === "Fiado" ? "Pendente" : "Concluida"
    });

    this.router.navigateByUrl("/historico");
  }

  private loadDependencies(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.isUsingFallbackData = false;
    this.fallbackMessage = "";

    let pending = 2;
    let hasApiFailure = false;

    const finish = () => {
      pending -= 1;

      if (pending === 0) {
        this.isLoading = false;

        if (hasApiFailure) {
          this.isUsingFallbackData = true;
          this.fallbackMessage =
            "API de clientes/produtos indisponivel no momento. Mantendo fallback local para validacao da tela de vendas.";
        }
      }
    };

    this.clientsApiService.listClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        finish();
      },
      error: () => {
        hasApiFailure = true;
        this.clients = mockClients;
        finish();
      },
    });

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.products = products;
        finish();
      },
      error: () => {
        hasApiFailure = true;
        this.products = mockProducts;
        finish();
      },
    });
  }
}
