import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter, startWith } from "rxjs";
import { Debtor } from "../../core/models";
import { ChatbotApiService, ChatbotSettings } from "../../core/services/chatbot-api.service";
import { FiadoApiService, FiadoResumo } from "../../core/services/fiado-api.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-debts",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: "./debts.component.html",
  styleUrl: "./debts.component.css"
})
export class DebtsComponent implements OnInit, OnDestroy {
  debtors: Debtor[] = [];
  resumo: FiadoResumo | null = null;
  isLoading = true;
  errorMessage = "";
  cronSettings: Pick<ChatbotSettings, "debtAutoCronEnabled" | "debtAutoCronTime"> = {
    debtAutoCronEnabled: false,
    debtAutoCronTime: "09:00",
  };
  private cronOriginal: ChatbotSettings | null = null;
  cronSaving = false;
  cronMessage = "";
  cronError = "";
  readonly formatCurrency = formatCurrency;
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly fiadoApiService: FiadoApiService,
    private readonly chatbotApiService: ChatbotApiService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    // Recarrega a carteira sempre que a rota terminar em /fiado — cobre o caso
    // de o componente reaproveitar instancia ou ngOnInit nao ser chamado em
    // navegacoes encadeadas. startWith null garante que dispara no boot.
    this.routeSubscription = this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        startWith(null),
      )
      .subscribe(() => {
        if (this.router.url.startsWith("/fiado")) {
          this.kickLoad();
        }
      });
  }

  ngOnInit(): void {
    this.kickLoad();
  }

  // Defere para o proximo tick: garante que o componente esteja anexado a CD
  // antes da requisicao. Resolve casos onde a primeira chamada em ngOnInit
  // dispara antes do view init e os callbacks nao reconciliam o template.
  private kickLoad(): void {
    setTimeout(() => {
      this.loadDebtors();
      this.loadResumo();
      this.loadCronSettings();
    }, 0);
  }

  private loadResumo(): void {
    this.fiadoApiService.getResumo().subscribe({
      next: (resumo) => {
        this.ngZone.run(() => {
          this.resumo = resumo;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        // resumo nao critico; cards mostram '—' se nao carregar.
      },
    });
  }

  get statusCarteiraLabel(): string {
    const map = { OK: "OK", ATENCAO: "Atencao", CRITICO: "Critico" } as const;
    return this.resumo ? map[this.resumo.statusCarteira] : "—";
  }

  registerPayment(debtor: Debtor): void {
    const input = prompt(
      `Valor pago por ${debtor.clientName} (saldo atual R$ ${debtor.amount.toFixed(2)}):`,
      debtor.amount.toFixed(2),
    );
    if (!input) return;

    const valor = Number(String(input).replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      this.errorMessage = "Valor invalido.";
      return;
    }

    this.fiadoApiService.registerPayment(debtor.clientId, valor).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          // Se quitou totalmente, remove da lista; senao atualiza.
          if (updated.amount <= 0) {
            this.debtors = this.debtors.filter((d) => d.clientId !== debtor.clientId);
          } else {
            this.debtors = this.debtors.map((d) =>
              d.clientId === debtor.clientId ? updated : d,
            );
          }
          this.loadResumo();
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.errorMessage = err?.error?.error || "Nao foi possivel registrar o pagamento.";
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  get totalDebt(): number {
    return this.debtors.reduce((sum, debtor) => sum + debtor.amount, 0);
  }

  get overdueClientsCount(): number {
    return this.debtors.length;
  }

  getClientName(clientId: number): string {
    const debtor = this.debtors.find((item) => item.clientId === clientId);

    return debtor?.clientName ?? "Cliente";
  }

  retry(): void {
    this.loadDebtors();
  }

  private loadCronSettings(): void {
    this.chatbotApiService.getSettings().subscribe({
      next: (settings) => {
        this.ngZone.run(() => {
          this.cronOriginal = settings;
          this.cronSettings = {
            debtAutoCronEnabled: settings.debtAutoCronEnabled,
            debtAutoCronTime: settings.debtAutoCronTime || "09:00",
          };
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        // Silencioso: o card mostra defaults e permite tentar salvar.
      },
    });
  }

  saveCronSettings(): void {
    if (!this.cronOriginal) return;
    if (this.cronSaving) return;

    this.cronSaving = true;
    this.cronMessage = "";
    this.cronError = "";
    this.changeDetectorRef.detectChanges();

    const payload: ChatbotSettings = {
      ...this.cronOriginal,
      debtAutoCronEnabled: this.cronSettings.debtAutoCronEnabled,
      debtAutoCronTime: this.cronSettings.debtAutoCronTime || "09:00",
    };

    this.chatbotApiService.updateSettings(payload).subscribe({
      next: (settings) => {
        this.ngZone.run(() => {
          this.cronOriginal = settings;
          this.cronSettings = {
            debtAutoCronEnabled: settings.debtAutoCronEnabled,
            debtAutoCronTime: settings.debtAutoCronTime || "09:00",
          };
          this.cronMessage = settings.debtAutoCronEnabled
            ? `Rotina ativada para disparar todos os dias as ${settings.debtAutoCronTime}.`
            : "Rotina desativada.";
          this.cronSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.cronError = "Nao foi possivel salvar as configuracoes da rotina.";
          this.cronSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  chargeDebtor(clientId: number): void {
    this.fiadoApiService.registerCharge(clientId).subscribe({
      next: (updatedDebtor) => {
        this.debtors = this.debtors.map((debtor) => (debtor.clientId === clientId ? updatedDebtor : debtor));
      },
      error: () => {
        this.errorMessage = "Nao foi possivel registrar cobranca na API.";
      },
    });
  }

  private loadDebtors(): void {
    this.isLoading = true;
    this.errorMessage = "";
    try {
      this.changeDetectorRef.detectChanges();
    } catch {
      // View ainda nao anexada — ignora; sera renderizado naturalmente.
    }

    // eslint-disable-next-line no-console
    console.log("[fiado] iniciando carregamento da carteira...");

    this.fiadoApiService.listDebtors().subscribe({
      next: (apiDebtors) => {
        this.ngZone.run(() => {
          // eslint-disable-next-line no-console
          console.log("[fiado] carregados", apiDebtors.length, "devedores");
          this.debtors = apiDebtors;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          // eslint-disable-next-line no-console
          console.error("[fiado] falha ao carregar carteira:", err?.status, err?.message);
          this.debtors = [];
          this.errorMessage = err?.status === 401
            ? "Sessao expirada. Faca login novamente."
            : "API de fiado indisponivel. Tente novamente em instantes.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }
}
