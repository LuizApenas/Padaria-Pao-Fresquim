// apps/web/src/app/features/chatbot-kpis/chatbot-kpis.component.ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter, startWith } from "rxjs";
import { ChatbotApiService, ChatbotKpis } from "../../core/services/chatbot-api.service";

@Component({
  selector: "pf-chatbot-kpis",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./chatbot-kpis.component.html",
  styleUrl: "./chatbot-kpis.component.css",
})
export class ChatbotKpisComponent implements OnInit, OnDestroy {
  kpis: ChatbotKpis | null = null;
  isLoading = true;
  errorMessage = "";
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly chatbotApiService: ChatbotApiService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.routeSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => {
        if (this.router.url.startsWith("/chatbot/kpis")) {
          setTimeout(() => this.loadKpis(), 0);
        }
      });
  }

  ngOnInit(): void {
    setTimeout(() => this.loadKpis(), 0);
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  retry(): void {
    this.loadKpis();
  }

  get periodoLabel(): string {
    if (!this.kpis?.periodo) return "";
    const inicio = new Date(this.kpis.periodo.inicio);
    const fim = new Date(this.kpis.periodo.fim);
    return `${inicio.toLocaleDateString("pt-BR")} ate ${new Date(fim.getTime() - 1).toLocaleDateString("pt-BR")}`;
  }

  private loadKpis(): void {
    this.isLoading = true;
    this.errorMessage = "";
    try { this.changeDetectorRef.detectChanges(); } catch { /* view nao anexada ainda */ }

    this.chatbotApiService.getKpis().subscribe({
      next: (kpis) => {
        this.ngZone.run(() => {
          this.kpis = kpis;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMessage = err?.status === 403
            ? "Apenas o proprietario pode ver os KPIs do chatbot."
            : "Nao foi possivel carregar os KPIs. Tente novamente em instantes.";
          this.kpis = null;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }
}
