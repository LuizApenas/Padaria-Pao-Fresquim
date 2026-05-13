import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { clients, debtors } from "../../core/mock-data";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-debts",
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: "./debts.component.html",
  styleUrl: "./debts.component.css"
})
export class DebtsComponent {
  readonly debtors = debtors;
  readonly clients = clients;
  readonly formatCurrency = formatCurrency;

  get totalDebt(): number {
    return this.debtors.reduce((sum, debtor) => sum + debtor.amount, 0);
  }

  getClientName(clientId: number): string {
    return this.clients.find((client) => client.id === clientId)?.name ?? "Cliente";
  }
}
