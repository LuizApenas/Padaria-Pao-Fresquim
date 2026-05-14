import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Client } from "../../core/models";
import { clients as mockClients } from "../../core/mock-data";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-clients",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: "./clients.component.html",
  styleUrl: "./clients.component.css"
})
export class ClientsComponent implements OnInit {
  query = "";
  clients: Client[] = [];
  isLoading = true;
  errorMessage = "";
  isUsingFallbackData = false;
  fallbackMessage = "";
  readonly formatCurrency = formatCurrency;

  constructor(private readonly clientsApiService: ClientsApiService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  get filteredClients() {
    const normalized = this.query.toLowerCase();
    return this.clients.filter((client) =>
      [client.name, client.email ?? "", client.phone].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    );
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get activeClients(): number {
    return this.clients.filter((client) => client.status === "Ativo").length;
  }

  get blockedClients(): number {
    return this.clients.filter((client) => client.status === "Bloqueado").length;
  }

  get averageTicket(): number {
    if (!this.clients.length) {
      return 0;
    }

    const total = this.clients.reduce((sum, client) => sum + client.ticket, 0);

    return Number((total / this.clients.length).toFixed(2));
  }

  retry(): void {
    this.loadClients();
  }

  private loadClients(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.isUsingFallbackData = false;
    this.fallbackMessage = "";

    this.clientsApiService.listClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.isLoading = false;
      },
      error: () => {
        this.clients = mockClients;
        this.isUsingFallbackData = true;
        this.fallbackMessage = "API de clientes indisponivel no momento. Exibindo dados locais para continuarmos a validacao da tela.";
        this.isLoading = false;
      },
    });
  }
}
