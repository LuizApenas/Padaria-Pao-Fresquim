import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Client, Debtor } from "../../core/models";
import { clients, debtors } from "../../core/mock-data";
import { ClientsApiService } from "../../core/services/clients-api.service";
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
  clients: Client[] = [];
  isLoading = true;
  isUsingFallbackData = false;
  fallbackMessage = "";
  readonly formatCurrency = formatCurrency;

  constructor(private readonly clientsApiService: ClientsApiService) {}

  ngOnInit(): void {
    this.loadFiadoFromClients();
  }

  get totalDebt(): number {
    return this.debtors.reduce((sum, debtor) => sum + debtor.amount, 0);
  }

  get overdueClientsCount(): number {
    return this.debtors.length;
  }

  getClientName(clientId: number): string {
    const debtor = this.debtors.find((item) => item.clientId === clientId);

    return debtor?.clientName ?? this.clients.find((client) => client.id === clientId)?.nome ?? "Cliente";
  }

  private loadFiadoFromClients(): void {
    this.isLoading = true;
    this.isUsingFallbackData = false;
    this.fallbackMessage = "";

    this.clientsApiService.listClients().subscribe({
      next: (apiClients) => {
        this.clients = apiClients;
        this.debtors = this.buildDebtorsFromClients(apiClients);
        this.isLoading = false;
      },
      error: () => {
        this.clients = clients.map((client) => this.clientsApiService.normalizeClient(client));
        this.debtors = debtors;
        this.isUsingFallbackData = true;
        this.fallbackMessage =
          "API de clientes indisponivel. Carteira de fiado exibida com dados mockados ate existir a rota dedicada de fiado.";
        this.isLoading = false;
      },
    });
  }

  private buildDebtorsFromClients(apiClients: Client[]): Debtor[] {
    return apiClients
      .filter((client) => Number(client.contaFiado?.saldoDevedor ?? 0) > 0)
      .map((client) => ({
        clientId: client.id,
        clientName: client.nome ?? client.name,
        phone: client.telefone ?? client.phone,
        amount: Number(client.contaFiado?.saldoDevedor ?? 0),
        overdue: client.contaFiado?.dataUltimaCobranca
          ? `Ultima cobranca em ${new Date(client.contaFiado.dataUltimaCobranca).toLocaleDateString("pt-BR")}`
          : "Sem cobranca registrada",
        status: client.statusSerasa === "NEGATIVADO" ? "Critico" : "Fiado ativo",
        lastPurchase: "Aguardando historico de vendas",
        lastInstallment: 0,
        statusNotificacao: client.contaFiado?.statusNotificacao ?? "NENHUMA",
      }));
  }
}
