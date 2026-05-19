import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { ChatMessage } from "../../core/models";
import { ChatbotApiService, ChatbotDailyMetrics } from "../../core/services/chatbot-api.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./chatbot.component.html",
  styleUrl: "./chatbot.component.css"
})
export class ChatbotComponent implements OnInit, OnDestroy {
  prompt = "";
  messages: ChatMessage[] = [
    {
      role: "assistant",
      title: "Valor AI",
      message: "Chatbot integrado as rotas de pedidos, fiado, Evolution e metricas diarias.",
      meta: "API",
    },
  ];
  metrics: ChatbotDailyMetrics | null = null;
  isLoading = true;
  errorMessage = "";
  private readonly routeSubscription: Subscription;
  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly chatbotApiService: ChatbotApiService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith("/chatbot")) {
          this.loadMetrics();
        }
      });
  }

  ngOnInit(): void {
    this.loadMetrics();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  sendMessage(content = this.prompt.trim()): void {
    if (!content) {
      return;
    }

    this.messages = [
      ...this.messages,
      { role: "user", title: "Arthur", message: content, meta: "Agora" },
      { role: "assistant", title: "Valor AI", message: this.generateChatResponse(content), meta: "API" },
    ];
    this.prompt = "";
  }

  retry(): void {
    this.loadMetrics();
  }

  private loadMetrics(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.getDailyMetrics().subscribe({
      next: (metrics) => {
        this.ngZone.run(() => {
          this.metrics = metrics;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.metrics = null;
          this.errorMessage = "API do chatbot indisponivel para metricas diarias.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private generateChatResponse(input: string): string {
    const normalized = input.toLowerCase();

    if (!this.metrics) {
      return "Ainda nao consegui consultar a API do chatbot. Verifique autenticacao e backend.";
    }

    if (normalized.includes("inadimpl") || normalized.includes("fiado") || normalized.includes("deve")) {
      return `Hoje existem ${this.metrics.debtClients} cliente(s) com fiado em aberto. A rota administrativa permite disparar aviso de Serasa por cliente.`;
    }

    if (normalized.includes("pedido") || normalized.includes("coleta") || normalized.includes("pronto")) {
      return `Ha ${this.metrics.pedidosPendentes} pedido(s) pendente(s). Quando um pedido ficar pronto, a API envia a notificacao pela Evolution.`;
    }

    if (normalized.includes("venda") || normalized.includes("hoje") || normalized.includes("dia")) {
      return `Hoje foram ${this.metrics.salesCount} venda(s), totalizando ${formatCurrency(this.metrics.totalSoldToday)} com ticket medio de ${formatCurrency(this.metrics.averageTicket)}.`;
    }

    if (normalized.includes("produto")) {
      const products = this.metrics.topProducts.map((item) => `${item.name} (${item.sales})`).join(", ");

      return products ? `Produtos em destaque hoje: ${products}.` : "Ainda nao ha produtos vendidos no periodo consultado.";
    }

    return "Posso consultar pedidos, fiado, avisos de coleta e metricas diarias pelas novas rotas do chatbot.";
  }
}
