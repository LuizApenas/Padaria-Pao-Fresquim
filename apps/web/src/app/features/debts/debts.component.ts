import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Debtor } from "../../core/models";
import { FiadoApiService } from "../../core/services/fiado-api.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-debts",
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: "./debts.component.html",
  styleUrl: "./debts.component.css"
})
export class DebtsComponent implements OnInit {
  debtors: Debtor[] = [];
  isLoading = true;
  errorMessage = "";
  readonly formatCurrency = formatCurrency;

  constructor(private readonly fiadoApiService: FiadoApiService) {}

  ngOnInit(): void {
    this.loadDebtors();
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

  chargeDebtor(clientId: number): void {
    this.fiadoApiService.registerCharge(clientId).subscribe({
      next: (updatedDebtor) => {
        this.debtors = this.debtors.map((debtor) => (debtor.clientId === clientId ? updatedDebtor : debtor));
      },
      error: () => {
        this.errorMessage = "Nao foi possivel registrar cobranca na API.";
      },
    });
  }

  private loadDebtors(): void {
    this.isLoading = true;
    this.errorMessage = "";

    this.fiadoApiService.listDebtors().subscribe({
      next: (apiDebtors) => {
        this.debtors = apiDebtors;
        this.isLoading = false;
      },
      error: () => {
        this.debtors = [];
        this.errorMessage = "API de fiado indisponivel. Nao ha fallback mockado para carteira de fiado.";
        this.isLoading = false;
      },
    });
  }
}
