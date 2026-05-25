import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter, startWith } from "rxjs";
import { Client, Product } from "../../core/models";
import { ApiErrorMessageService } from "../../core/services/api-error-message.service";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { ProductsApiService } from "../../core/services/products-api.service";
import { SalesApiService } from "../../core/services/sales-api.service";
import { ToastService } from "../../core/services/toast.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-sale",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./sale.component.html",
  styleUrl: "./sale.component.css"
})
export class SaleComponent implements OnInit, OnDestroy {
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
  checkoutMessage = "";

  readonly formatCurrency = formatCurrency;
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly router: Router,
    private readonly clientsApiService: ClientsApiService,
    private readonly productsApiService: ProductsApiService,
    private readonly salesApiService: SalesApiService,
    private readonly confirmService: ConfirmService,
    private readonly toastService: ToastService,
    private readonly apiErrorMessageService: ApiErrorMessageService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.routeSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => {
        if (this.router.url.startsWith("/vendas/nova")) {
          this.kickLoad();
        }
      });
  }

  ngOnInit(): void {
    this.kickLoad();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  private kickLoad(): void {
    setTimeout(() => this.loadDependencies(), 0);
  }

  get catalog() {
    const normalized = this.search.toLowerCase().trim();
    if (!normalized) {
      return this.products;
    }
    return this.products.filter((product) =>
      (product.nome ?? product.name ?? "").toLowerCase().includes(normalized) ||
      String(product.codigoBarras ?? product.sku ?? "").includes(normalized),
    );
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get selectedClient(): Client | undefined {
    const selectedId = Number(this.selectedClientId);

    if (!selectedId) {
      return undefined;
    }

    return this.clients.find((client) => client.id === selectedId);
  }

  get isSelectedClientBlocked(): boolean {
    const status = this.selectedClient?.statusSerasa ?? this.selectedClient?.status ?? "";

    return status.toUpperCase() === "NEGATIVADO";
  }

  retry(): void {
    this.loadDependencies();
  }

  addProduct(product: Product): void {
    this.checkoutMessage = "";
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
    const removed = this.cart.find((item) => item.id === id);
    const index = this.cart.findIndex((item) => item.id === id);
    this.cart = this.cart.filter((item) => item.id !== id);

    if (!removed || index < 0) {
      return;
    }

    this.toastService.show(`Item removido: ${removed.name}.`, "info", {
      label: "Desfazer",
      run: () => {
        const next = [...this.cart];
        next.splice(index, 0, removed);
        this.cart = next;
      },
    });
  }

  async finalizeSale(): Promise<void> {
    this.checkoutMessage = "";

    if (!this.cart.length) {
      this.checkoutMessage = "Adicione ao menos um produto antes de finalizar a venda.";
      return;
    }

    if (this.payment === "Fiado" && !this.selectedClientId) {
      this.checkoutMessage = "Venda no fiado exige cliente identificado. Selecione um cliente antes de finalizar.";
      return;
    }

    if (this.payment === "Fiado" && this.isSelectedClientBlocked) {
      const clientName = this.selectedClient?.nome ?? this.selectedClient?.name ?? "Cliente selecionado";
      this.checkoutMessage = `${clientName} esta negativado e nao pode comprar no fiado. Escolha outra forma de pagamento ou regularize o cadastro.`;
      this.toastService.show(this.checkoutMessage, "danger");
      return;
    }

    const confirmed = await this.confirmService.ask({
      title: "Finalizar venda?",
      message: `A venda sera registrada com ${this.cart.length} item(ns), pagamento ${this.payment} e total ${this.formatCurrency(this.subtotal)}.`,
      confirmLabel: "Finalizar venda",
    });

    if (!confirmed) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = "";

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
      error: (error) => {
        this.isSubmitting = false;
        this.checkoutMessage = this.apiErrorMessageService.describe(error, "Nao foi possivel finalizar a venda.");
      },
    });
  }

  private loadDependencies(): void {
    this.isLoading = true;
    this.errorMessage = "";
    try { this.changeDetectorRef.detectChanges(); } catch { /* view nao anexada */ }

    let pending = 2;
    let hasApiFailure = false;

    const finish = () => {
      pending -= 1;
      if (pending !== 0) return;

      this.ngZone.run(() => {
        this.isLoading = false;
        if (hasApiFailure) {
          this.errorMessage = "Nao consegui carregar clientes e produtos. Verifique se a API esta rodando e tente novamente.";
        }
        this.changeDetectorRef.detectChanges();
      });
    };

    this.clientsApiService.listClients().subscribe({
      next: (clients) => {
        this.ngZone.run(() => {
          this.clients = clients;
          finish();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          hasApiFailure = true;
          this.clients = [];
          finish();
        });
      },
    });

    this.productsApiService.listProducts().subscribe({
      next: (products) => {
        this.ngZone.run(() => {
          this.products = products;
          finish();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          hasApiFailure = true;
          this.products = [];
          finish();
        });
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
