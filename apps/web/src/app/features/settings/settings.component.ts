import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NavigationEnd, Router } from "@angular/router";
import { Subscription, filter } from "rxjs";
import { ChatbotApiService, ChatbotSettings } from "../../core/services/chatbot-api.service";

@Component({
  selector: "pf-settings",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css"
})
export class SettingsComponent implements OnInit, OnDestroy {
  settings: ChatbotSettings = {
    evolutionApiUrl: "",
    evolutionApiKey: "",
    evolutionDispatchPath: "/message/sendText",
    webhookToken: "",
    ownerPhone: "",
    orderReadyNotificationsEnabled: true,
    debtWarningsEnabled: true,
    dailyMetricsEnabled: true,
  };
  isLoading = true;
  isSaving = false;
  message = "";
  errorMessage = "";
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
    return `${window.location.origin.replace(/\/+$/, "")}/api/chatbot/webhook/evolution?token=${encodeURIComponent(this.settings.webhookToken || "TOKEN_DO_PAINEL")}`;
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
