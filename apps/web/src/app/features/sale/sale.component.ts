import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Client, Product } from "../../core/models";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { ProductsApiService } from "../../core/services/products-api.service";
import { SalesApiService } from "../../core/services/sales-api.service";
import { StorageService } from "../../core/services/storage.service";
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
  isSubmitting = false;
  errorMessage = "";
  statusMessage = "";

  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly router: Router,
    private readonly clientsApiService: ClientsApiService,
    private readonly productsApiService: ProductsApiService,
    private readonly salesApiService: SalesApiService,
    private readonly storageService: StorageService,
  ) {}

  ngOnInit(): void {
    this.loadDependencies();
  }

  get catalog() {
    const normalized = this.search.toLowerCase();
    return this.products
      .filter((product) =>
        (product.nome ?? product.name).toLowerCase().includes(normalized) ||
        (product.codigoBarras ?? product.sku).includes(this.search),
      )
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
    this.cart = [
      ...this.cart,
      {
        id: product.id,
        name: product.nome ?? product.name,
        price: Number(product.precoBase ?? product.price),
        quantity: 1,
      },
    ];
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

    this.isSubmitting = true;
    this.errorMessage = "";
    this.statusMessage = "";

    this.salesApiService.createSale({
      clienteId: this.selectedClientId ? Number(this.selectedClientId) : null,
      formaPagamento: this.toFormaPagamento(this.payment),
      status: "CONCLUIDA",
      itens: this.cart.map((item) => ({
        produtoId: item.id,
        quantidade: item.quantity,
      })),
    }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl("/historico");
      },
      error: () => {
        const selectedClient = this.clients.find((client) => String(client.id) === this.selectedClientId);
        this.storageService.appendSale({
          id: `#VEN-${Date.now()}`,
          datetime: new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date()),
          client: selectedClient?.nome ?? selectedClient?.name ?? "Cliente balcao",
          mainProduct: this.cart.map((item) => item.name).join(", "),
          payment: this.payment,
          value: this.subtotal - this.discount > 0 ? this.subtotal - this.discount : 0,
          status: "Concluida",
        });

        this.isSubmitting = false;
        this.statusMessage = "Venda salva localmente enquanto a API estiver indisponivel.";
        this.router.navigateByUrl("/historico");
      },
    });
  }

  private loadDependencies(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.statusMessage = "";

    let pending = 2;
    let hasApiFailure = false;
    const localProducts = this.storageService.getProducts();

    const finish = () => {
      pending -= 1;

      if (pending === 0) {
        this.isLoading = false;

        if (hasApiFailure) {
          this.errorMessage = "API de clientes ou produtos indisponivel. O catalogo local continua disponivel para registrar a venda.";
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
        this.clients = [];
        finish();
      },
    });

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.products = this.mergeProducts(products, localProducts);
        finish();
      },
      error: () => {
        hasApiFailure = true;
        this.products = localProducts;
        finish();
      },
    });
  }

  private mergeProducts(primaryProducts: Product[], secondaryProducts: Product[]): Product[] {
    const productMap = new Map<number, Product>();

    [...secondaryProducts, ...primaryProducts]
      .map((product) => this.productsApiService.normalizeProduct(product))
      .forEach((product) => {
        productMap.set(product.id, product);
      });

    return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  private toFormaPagamento(payment: string): string {
    const paymentMap: Record<string, string> = {
      Dinheiro: "DINHEIRO",
      Credito: "CREDITO",
      Debito: "DEBITO",
      PIX: "PIX",
      Fiado: "FIADO",
    };

    return paymentMap[payment] ?? payment;
  }
}
