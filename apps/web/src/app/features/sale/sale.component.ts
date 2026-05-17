import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Client, Product } from "../../core/models";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { ProductsApiService } from "../../core/services/products-api.service";
import { SalesApiService } from "../../core/services/sales-api.service";
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

  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly router: Router,
    private readonly clientsApiService: ClientsApiService,
    private readonly productsApiService: ProductsApiService,
    private readonly salesApiService: SalesApiService,
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

    this.salesApiService.createSale({
      funcionarioId: 1,
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
        this.isSubmitting = false;
        this.errorMessage = "Nao foi possivel finalizar a venda na API.";
      },
    });
  }

  private loadDependencies(): void {
    this.isLoading = true;
    this.errorMessage = "";

    let pending = 2;
    let hasApiFailure = false;

    const finish = () => {
      pending -= 1;

      if (pending === 0) {
        this.isLoading = false;

        if (hasApiFailure) {
          this.errorMessage = "API de clientes/produtos indisponivel. Nao ha fallback mockado na tela de venda.";
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
        this.products = products;
        finish();
      },
      error: () => {
        hasApiFailure = true;
        this.products = [];
        finish();
      },
    });
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
