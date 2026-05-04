import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { clients, debtors, reports, weeklySales } from "../../core/mock-data";
import { StorageService } from "../../core/services/storage.service";
import { ChatMessage } from "../../core/models";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-chatbot",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: "./chatbot.component.html",
  styleUrl: "./chatbot.component.css"
})
export class ChatbotComponent {
  prompt = "";
  messages = this.storageService.getChatMessages();

  constructor(private readonly storageService: StorageService) {}

  sendMessage(content = this.prompt.trim()): void {
    if (!content) {
      return;
    }

    const nextMessages: ChatMessage[] = [
      ...this.messages,
      { role: "user", title: "Arthur", message: content, meta: "Agora" },
      { role: "assistant", title: "Valor AI", message: this.generateChatResponse(content), meta: "Agora" }
    ];

    this.messages = nextMessages;
    this.storageService.saveChatMessages(nextMessages);
    this.prompt = "";
  }

  private generateChatResponse(input: string): string {
    const normalized = input.toLowerCase();

    if (normalized.includes("inadimpl") || normalized.includes("deve")) {
      const topDebtors = debtors
        .map((debtor) => ({ ...debtor, client: clients.find((item) => item.id === debtor.clientId)?.name ?? "Cliente" }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map((item) => `${item.client} (${formatCurrency(item.amount)})`)
        .join(", ");
      return `Hoje os principais devedores sao ${topDebtors}.`;
    }

    if (normalized.includes("venda") || normalized.includes("semana")) {
      const total = weeklySales.reduce((sum, item) => sum + item.value, 0);
      return `Na semana simulada voce acumulou ${formatCurrency(total)} em vendas.`;
    }

    if (normalized.includes("produto")) {
      return `Os produtos com maior destaque no periodo sao ${reports.topProducts.map((item) => item.name).join(", ")}.`;
    }

    return "Consigo responder sobre vendas, produtos, inadimplencia, cameras e indicadores com base nos dados simulados.";
  }
}
