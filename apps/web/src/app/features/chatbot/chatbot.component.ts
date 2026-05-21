// apps/web/src/app/features/chatbot/chatbot.component.ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { ChatMessage } from "../../core/models";
import {
  ChatbotApiService,
  ChatbotDailyMetrics,
  ChatbotPeriodMetrics,
} from "../../core/services/chatbot-api.service";
import { formatCurrency } from "../../core/utils/format";
import { ChatbotPeriod, parsePeriodFromMessage } from "./chatbot-period.utils";

@Component({
  selector: "pf-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./chatbot.component.html",
  styleUrl: "./chatbot.component.css",
})
export class ChatbotComponent implements OnInit, OnDestroy {
  @ViewChild("messagesViewport")
  private messagesViewport?: ElementRef<HTMLElement>;

  prompt = "";
  messages: ChatMessage[] = [
    {
      role: "assistant",
      title: "Assistente",
      message:
        "Assistente com Groq LLM, regras de seguranca e dados reais da API. Posso ajudar com metricas e pedidos de clientes cadastrados.",
      meta: "Sistema protegido",
    },
  ];
  metrics: ChatbotDailyMetrics | null = null;
  weeklyMetrics: ChatbotPeriodMetrics | null = null;
  monthlyMetrics: ChatbotPeriodMetrics | null = null;
  weeklyExpanded = false;
  monthlyExpanded = false;
  weeklyLoading = false;
  monthlyLoading = false;
  weeklyError = "";
  monthlyError = "";
  isLoading = true;
  isResponding = false;
  errorMessage = "";
  private readonly routeSubscription: Subscription;
  readonly formatCurrency = formatCurrency;
  readonly quickSuggestions = [
    "Vendas de hoje",
    "Vendas de maio",
    "Resumo da semana",
    "Clientes inadimplentes",
  ];

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
    if (!content || this.isResponding) {
      return;
    }

    const previousMessages = this.messages;
    this.messages = [
      ...this.messages,
      { role: "user", title: "Voce", message: content, meta: "Agora" },
    ];
    this.prompt = "";
    this.renderAndScrollMessages();

    const period = parsePeriodFromMessage(content);

    if (period) {
      this.replyWithPeriod(content, period);
      return;
    }

    this.isResponding = true;
    this.renderAndScrollMessages();

    this.chatbotApiService.sendMessage({
      message: content,
      messages: previousMessages.map((message) => ({
        role: message.role,
        message: message.message,
      })),
    }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.appendAssistantMessage(response.reply, response.source === "groq" ? "Groq" : response.intent);
          this.isResponding = false;
          this.renderAndScrollMessages();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.appendAssistantMessage(this.generateDailyResponse(content), "Fallback local");
          this.isResponding = false;
          this.renderAndScrollMessages();
        });
      },
    });
  }

  handlePromptKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.shiftKey || this.isResponding) {
      return;
    }

    keyboardEvent.preventDefault();
    this.sendMessage();
  }

  retry(): void {
    this.loadMetrics();
  }

  toggleWeeklyMetrics(): void {
    this.weeklyExpanded = !this.weeklyExpanded;

    if (this.weeklyExpanded && !this.weeklyMetrics && !this.weeklyLoading) {
      this.loadWeeklyMetrics();
    }
  }

  toggleMonthlyMetrics(): void {
    this.monthlyExpanded = !this.monthlyExpanded;

    if (this.monthlyExpanded && !this.monthlyMetrics && !this.monthlyLoading) {
      this.loadMonthlyMetrics();
    }
  }

  private loadWeeklyMetrics(): void {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const fmt = (date: Date) => date.toISOString().slice(0, 10);

    this.weeklyLoading = true;
    this.weeklyError = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.getPeriodMetrics(fmt(start), fmt(today)).subscribe({
      next: (metrics) => {
        this.ngZone.run(() => {
          this.weeklyMetrics = metrics;
          this.weeklyLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.weeklyError = "Nao foi possivel carregar metricas semanais.";
          this.weeklyLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private loadMonthlyMetrics(): void {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const fmt = (date: Date) => date.toISOString().slice(0, 10);

    this.monthlyLoading = true;
    this.monthlyError = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.getPeriodMetrics(fmt(start), fmt(today)).subscribe({
      next: (metrics) => {
        this.ngZone.run(() => {
          this.monthlyMetrics = metrics;
          this.monthlyLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.monthlyError = "Nao foi possivel carregar metricas mensais.";
          this.monthlyLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private replyWithPeriod(question: string, period: ChatbotPeriod): void {
    this.isResponding = true;
    this.renderAndScrollMessages();

    this.chatbotApiService.getPeriodMetrics(period.dataInicio, period.dataFim).subscribe({
      next: (metrics) => {
        this.ngZone.run(() => {
          this.appendAssistantMessage(
            this.generatePeriodResponse(question, metrics, period.label),
            period.label,
          );
          this.isResponding = false;
          this.renderAndScrollMessages();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.appendAssistantMessage(
            `Nao consegui consultar ${period.label}. Verifique login e se a API esta online.`,
            "Erro",
          );
          this.isResponding = false;
          this.renderAndScrollMessages();
        });
      },
    });
  }

  private appendAssistantMessage(message: string, meta: string): void {
    this.messages = [
      ...this.messages,
      { role: "assistant", title: "Assistente", message, meta },
    ];
  }

  private renderAndScrollMessages(): void {
    this.changeDetectorRef.detectChanges();
    this.scrollMessagesToBottom();
  }

  private scrollMessagesToBottom(): void {
    this.ngZone.runOutsideAngular(() => {
      window.requestAnimationFrame(() => {
        const element = this.messagesViewport?.nativeElement;

        if (!element) {
          return;
        }

        element.scrollTo({
          top: element.scrollHeight,
          behavior: "smooth",
        });
      });
    });
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

  private generateDailyResponse(input: string): string {
    const normalized = input.toLowerCase();

    if (!this.metrics) {
      return "Ainda nao consegui consultar a API. Verifique autenticacao e backend.";
    }

    return this.buildResponseFromMetrics(input, {
      totalSold: this.metrics.totalSoldToday,
      salesCount: this.metrics.salesCount,
      averageTicket: this.metrics.averageTicket,
      debtClients: this.metrics.debtClients,
      pedidosPendentes: this.metrics.pedidosPendentes,
      topProducts: this.metrics.topProducts,
    }, "hoje");
  }

  private generatePeriodResponse(
    input: string,
    metrics: ChatbotPeriodMetrics,
    periodLabel: string,
  ): string {
    return this.buildResponseFromMetrics(
      input,
      {
        totalSold: metrics.totalSold,
        salesCount: metrics.salesCount,
        averageTicket: metrics.averageTicket,
        debtClients: metrics.debtClients,
        pedidosPendentes: metrics.pedidosPendentes,
        topProducts: metrics.topProducts,
      },
      periodLabel,
    );
  }

  private buildResponseFromMetrics(
    input: string,
    metrics: {
      totalSold: number;
      salesCount: number;
      averageTicket: number;
      debtClients: number;
      pedidosPendentes: number;
      topProducts: Array<{ name: string; sales: number }>;
    },
    periodLabel: string,
  ): string {
    const normalized = input.toLowerCase();

    if (normalized.includes("inadimpl") || normalized.includes("fiado") || normalized.includes("deve")) {
      return `Em ${periodLabel}, o sistema registra ${metrics.debtClients} cliente(s) com fiado em aberto no momento.`;
    }

    if (normalized.includes("pedido") || normalized.includes("coleta") || normalized.includes("pronto")) {
      return `Em ${periodLabel}, ha ${metrics.pedidosPendentes} pedido(s) pendente(s) no periodo consultado.`;
    }

    if (normalized.includes("produto")) {
      const products = metrics.topProducts.map((item) => `${item.name} (${item.sales})`).join(", ");

      return products
        ? `Produtos em destaque em ${periodLabel}: ${products}.`
        : `Nao ha produtos vendidos em ${periodLabel}.`;
    }

    if (
      normalized.includes("venda") ||
      normalized.includes("resumo") ||
      normalized.includes("hoje") ||
      normalized.includes("dia") ||
      normalized.includes("mes") ||
      normalized.includes("semana")
    ) {
      return `Em ${periodLabel}: ${metrics.salesCount} venda(s), total de ${formatCurrency(metrics.totalSold)} e ticket medio de ${formatCurrency(metrics.averageTicket)}.`;
    }

    return `Consigo responder sobre vendas, produtos, fiado e pedidos usando dados reais. Tente "vendas de maio" ou "resumo da semana".`;
  }
}
