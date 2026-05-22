import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter } from "rxjs";
import {
  API_BASE_URL,
  ChatbotApiService,
  ChatbotSettings,
} from "../../core/services/chatbot-api.service";

@Component({
  selector: "pf-settings",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css"
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: ChatbotSettings = {
    evolutionApiUrl: "",
    evolutionApiKey: "",
    evolutionDispatchPath: "/message/sendText",
    ownerPhone: "5511999990001",
    orderReadyNotificationsEnabled: true,
    debtWarningsEnabled: true,
    dailyMetricsEnabled: true,
    messageBufferMs: 2500,
  };
  testMessage = "Teste de integracao Evolution - Padaria Pao Fresquim.";

  // Mascara a API Key para nao expor o valor inteiro no front (somente leitura).
  get maskedApiKey(): string {
    const key = this.settings.evolutionApiKey ?? "";
    if (!key) {
      return "";
    }
    if (key.length <= 8) {
      return "*".repeat(key.length);
    }
    return `${key.slice(0, 4)}${"*".repeat(Math.max(key.length - 8, 4))}${key.slice(-4)}`;
  }
  isLoading = true;
  isSaving = false;
  isSendingTest = false;
  message = "";
  errorMessage = "";
  testMessageResult = "";
  testMessageError = "";
  private readonly routeSubscription: Subscription;

  constructor(
    private readonly chatbotApiService: ChatbotApiService,
    private readonly router: Router,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {
    this.routeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.urlAfterRedirects.startsWith("/configuracoes")) {
          this.loadSettings();
        }
      });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  get webhookUrl(): string {
    const apiBase = API_BASE_URL.replace(/\/+$/, "");

    return `${apiBase}/api/chatbot/webhook/evolution`;
  }

  loadSettings(): void {
    this.isLoading = true;
    this.message = "";
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.getSettings().subscribe({
      next: (settings) => {
        this.ngZone.run(() => {
          this.settings = settings;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (error: HttpErrorResponse) => {
        this.ngZone.run(() => {
          this.errorMessage = this.getApiErrorMessage(error, "carregar");
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  sendTestMessage(): void {
    this.isSendingTest = true;
    this.testMessageResult = "";
    this.testMessageError = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService
      .sendTestMessage({
        phone: this.settings.ownerPhone || undefined,
        message: this.testMessage.trim() || undefined,
      })
      .subscribe({
        next: (result) => {
          this.ngZone.run(() => {
            const payload = result as { skipped?: boolean; reason?: string };
            this.testMessageResult = payload?.skipped
              ? `Disparo ignorado: ${payload.reason ?? "URL Evolution nao configurada."}`
              : "Mensagem de teste enviada pela Evolution.";
            this.isSendingTest = false;
            this.changeDetectorRef.detectChanges();
          });
        },
        error: (error: HttpErrorResponse) => {
          this.ngZone.run(() => {
            this.testMessageError =
              error.error?.message ||
              error.message ||
              "Nao foi possivel enviar a mensagem de teste.";
            this.isSendingTest = false;
            this.changeDetectorRef.detectChanges();
          });
        },
      });
  }

  saveSettings(): void {
    this.isSaving = true;
    this.message = "";
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.updateSettings(this.settings).subscribe({
      next: (settings) => {
        this.ngZone.run(() => {
          this.settings = settings;
          this.message = "Configuracoes do chatbot salvas na API.";
          this.isSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (error: HttpErrorResponse) => {
        this.ngZone.run(() => {
          this.errorMessage = this.getApiErrorMessage(error, "salvar");
          this.isSaving = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private getApiErrorMessage(error: HttpErrorResponse, action: "carregar" | "salvar"): string {
    if (error.status === 401) {
      return "Sessao expirada ou token invalido. Faca login novamente.";
    }

    if (error.status === 403) {
      return "Apenas o proprietario pode acessar as configuracoes do chatbot.";
    }

    return `Nao foi possivel ${action} configuracoes do chatbot.`;
  }
}
