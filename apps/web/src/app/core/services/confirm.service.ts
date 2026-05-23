import { Injectable, signal } from "@angular/core";

export type ConfirmDialogState = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "default" | "danger";
};

type PendingConfirm = {
  resolve: (value: boolean) => void;
};

@Injectable({ providedIn: "root" })
export class ConfirmService {
  readonly dialog = signal<ConfirmDialogState | null>(null);
  private pending: PendingConfirm | null = null;

  ask(options: Partial<ConfirmDialogState> & Pick<ConfirmDialogState, "title" | "message">): Promise<boolean> {
    this.pending?.resolve(false);

    this.dialog.set({
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? "Confirmar",
      cancelLabel: options.cancelLabel ?? "Cancelar",
      tone: options.tone ?? "default",
    });

    return new Promise<boolean>((resolve) => {
      this.pending = { resolve };
    });
  }

  confirm(): void {
    this.finish(true);
  }

  cancel(): void {
    this.finish(false);
  }

  private finish(value: boolean): void {
    this.pending?.resolve(value);
    this.pending = null;
    this.dialog.set(null);
  }
}
