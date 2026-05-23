import { Injectable, signal } from "@angular/core";

export type ToastAction = {
  label: string;
  run: () => void;
};

export type ToastMessage = {
  id: number;
  text: string;
  tone: "success" | "info" | "warning" | "danger";
  action?: ToastAction;
};

@Injectable({ providedIn: "root" })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private nextId = 1;

  show(text: string, tone: ToastMessage["tone"] = "info", action?: ToastAction): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, text, tone, action }]);

    window.setTimeout(() => this.dismiss(id), action ? 8000 : 4500);
  }

  dismiss(id: number): void {
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }
}
