import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter, startWith } from "rxjs";
import { Debtor } from "../../core/models";
import { ChatbotApiService, ChatbotSettings } from "../../core/services/chatbot-api.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { FiadoApiService, FiadoResumo } from "../../core/services/fiado-api.service";
import { ToastService } from "../../core/services/toast.service";
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
    private readonly toastService: ToastService,
    private readonly confirmService: ConfirmService,
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
      this.toastService.show("Valor invalido. Informe um numero positivo.", "warning");
      return;
    }

    this.fiadoApiService.registerPayment(debtor.clientId, valor).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          if (updated.amount <= 0) {
            this.debtors = this.debtors.filter((d) => d.clientId !== debtor.clientId);
            this.toastService.show(
              `${debtor.clientName} quitou o fiado (R$ ${valor.toFixed(2)} recebido).`,
              "success",
            );
          } else {
            this.debtors = this.debtors.map((d) =>
              d.clientId === debtor.clientId ? updated : d,
            );
            this.toastService.show(
              `Pagamento de R$ ${valor.toFixed(2)} registrado. Saldo restante: R$ ${updated.amount.toFixed(2)}.`,
              "success",
            );
          }
          this.loadResumo();
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          const msg = err?.error?.error || "Nao foi possivel registrar o pagamento.";
          this.errorMessage = msg;
          this.toastService.show(msg, "danger");
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
          this.toastService.show(this.cronMessage, "success");
          this.cronSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.cronError = "Nao foi possivel salvar as configuracoes da rotina.";
          this.toastService.show(this.cronError, "danger");
          this.cronSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  chargeDebtor(clientId: number): void {
    const debtor = this.debtors.find((d) => d.clientId === clientId);
    const nome = debtor?.clientName || "Cliente";

    this.fiadoApiService.registerCharge(clientId).subscribe({
      next: (updatedDebtor) => {
        this.ngZone.run(() => {
          this.debtors = this.debtors.map((d) => (d.clientId === clientId ? updatedDebtor : d));
          const status = updatedDebtor.statusNotificacao;
          if (status === "ENVIADA") {
            this.toastService.show(`Cobranca enviada por WhatsApp para ${nome}.`, "success");
          } else if (status === "FALHOU") {
            this.toastService.show(`Cobranca registrada, mas o WhatsApp falhou para ${nome}.`, "warning");
          } else {
            this.toastService.show(`Cobranca marcada como PENDENTE para ${nome} (sem telefone ou aviso desligado).`, "info");
          }
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          const msg = err?.error?.error || "Nao foi possivel registrar a cobranca.";
          this.errorMessage = msg;
          this.toastService.show(msg, "danger");
          this.changeDetectorRef.detectChanges();
        });
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
