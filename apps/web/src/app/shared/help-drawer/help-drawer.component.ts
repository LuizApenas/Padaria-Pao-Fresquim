// apps/web/src/app/shared/help-drawer/help-drawer.component.ts
// Drawer flutuante da Fresca Helper: tira duvida sobre como usar a pagina atual.

import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectorRef, Component, EventEmitter, Input, NgZone, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { HelpApiService } from "../../core/services/help-api.service";

type HelpMessage = {
  role: "user" | "assistant";
  text: string;
};

@Component({
  selector: "pf-help-drawer",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./help-drawer.component.html",
  styleUrl: "./help-drawer.component.css",
})
export class HelpDrawerComponent {
  @Input() page: string | null = null;
  @Input() set open(value: boolean) {
    this._open = value;
    if (value && this.messages.length === 0) {
      this.seedInitialMessage();
    }
  }
  get open(): boolean {
    return this._open;
  }
  @Output() close = new EventEmitter<void>();

  prompt = "";
  isAsking = false;
  errorMessage = "";
  messages: HelpMessage[] = [];
  private _open = false;

  readonly quickQuestions = [
    "Como cadastrar um cliente?",
    "Como abrir uma venda no fiado?",
    "Como avisar pedido pronto pelo WhatsApp?",
    "O que cada metrica do dashboard significa?",
  ];

  constructor(
    private readonly helpApi: HelpApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  closeDrawer(): void {
    this.close.emit();
  }

  ask(text?: string): void {
    const message = (text ?? this.prompt).trim();
    if (!message || this.isAsking) return;

    this.messages = [...this.messages, { role: "user", text: message }];
    this.prompt = "";
    this.isAsking = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.helpApi.ask(message, this.page).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.messages = [...this.messages, { role: "assistant", text: response.reply }];
          this.isAsking = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: (err: HttpErrorResponse) => {
        this.ngZone.run(() => {
          this.errorMessage =
            err.error?.error ||
            "Nao consegui responder agora. Tente novamente em alguns segundos.";
          this.isAsking = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  handleEnter(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.shiftKey) return;
    keyboardEvent.preventDefault();
    this.ask();
  }

  private seedInitialMessage(): void {
    const pageLabel = this.page ? this.page.replace(/-/g, " ") : "qualquer pagina";
    this.messages = [
      {
        role: "assistant",
        text: `Oi! 🥖 Sou a Fresca em modo ajuda. Posso te explicar como usar o sistema. Voce esta em "${pageLabel}". Pergunte o que quiser sobre essa tela ou outras.`,
      },
    ];
  }
}
