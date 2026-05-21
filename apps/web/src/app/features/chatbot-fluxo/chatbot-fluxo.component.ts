// apps/web/src/app/features/chatbot-fluxo/chatbot-fluxo.component.ts
import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  ChatbotApiService,
  ChatbotDocumentacao,
} from "../../core/services/chatbot-api.service";

type TabId = 'overview' | 'prompt' | 'rules' | 'flow';

@Component({
  selector: "pf-chatbot-fluxo",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./chatbot-fluxo.component.html",
  styleUrl: "./chatbot-fluxo.component.css",
})
export class ChatbotFluxoComponent implements OnInit {
  doc: ChatbotDocumentacao | null = null;
  isLoading = true;
  errorMessage = "";

  activeTab: TabId = 'overview';

  readonly tabs: { id: TabId; label: string }[] = [
    { id: 'overview',  label: 'Visão Geral'        },
    { id: 'prompt',    label: 'System Prompt'       },
    { id: 'rules',     label: 'Regras e Intenções'  },
    { id: 'flow',      label: 'Fluxo de Passos'     },
  ];

  setTab(tab: TabId): void {
    this.activeTab = tab;
  }

  constructor(
    private readonly chatbotApiService: ChatbotApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadDocumentacao();
  }

  loadDocumentacao(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.chatbotApiService.getDocumentacao().subscribe({
      next: (doc) => {
        this.ngZone.run(() => {
          this.doc = doc;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (error: unknown) => {
        this.ngZone.run(() => {
          this.errorMessage = this.getDocumentacaoErrorMessage(error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private getDocumentacaoErrorMessage(error: unknown): string {
    if (error && typeof error === "object" && "name" in error && error.name === "TimeoutError") {
      return "A requisicao demorou demais. Verifique se a API esta rodando e tente novamente.";
    }

    const httpError = error as HttpErrorResponse;
    const apiMessage =
      typeof httpError.error === "object" && httpError.error && "error" in httpError.error
        ? String((httpError.error as { error?: string }).error ?? "")
        : "";

    if (httpError.status === 401) {
      return "Sessao expirada ou token invalido. Faca login novamente.";
    }

    if (httpError.status === 403) {
      return apiMessage || "Seu perfil nao tem permissao para ver a documentacao do chatbot.";
    }

    if (httpError.status === 404) {
      return "Endpoint de documentacao nao encontrado na API. Reinicie o servidor da API (npm run dev) e atualize a pagina.";
    }

    if (httpError.status === 0) {
      return "Nao foi possivel conectar a API. Confira se ela esta rodando e se o CORS permite a origem do front.";
    }

    if (apiMessage) {
      return apiMessage;
    }

    return "Nao foi possivel carregar a documentacao do fluxo.";
  }
}
