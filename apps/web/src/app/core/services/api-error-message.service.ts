import { Injectable } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";

@Injectable({ providedIn: "root" })
export class ApiErrorMessageService {
  describe(error: unknown, fallback: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallback;
    }

    const payload = error.error;
    const message =
      typeof payload === "string"
        ? payload
        : payload?.message || payload?.error || fallback;
    const suggestion = typeof payload === "object" ? payload?.suggestion : "";

    if (suggestion) {
      return `${message} ${suggestion}`;
    }

    if (error.status === 0) {
      return "Nao consegui falar com a API. Verifique se o backend esta rodando em http://localhost:3333.";
    }

    return message;
  }
}
