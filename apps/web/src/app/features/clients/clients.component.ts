import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Client } from "../../core/models";
import { clients as mockClients } from "../../core/mock-data";
import { ClientsApiService } from "../../core/services/clients-api.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

type ClientForm = {
  id: number | null;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
  statusSerasa: string;
  debtStatus: string;
  ticket: number;
};

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
  isModalOpen = false;
  modalMode: "create" | "edit" = "create";
  readonly formatCurrency = formatCurrency;
  readonly statusOptions = ["REGULAR", "NEGATIVADO"];
  readonly debtStatusOptions = ["Em dia", "Fiado ativo", "Bloqueado", "Critico", "Acompanhando"];
  form: ClientForm = this.getEmptyForm();

  constructor(private readonly clientsApiService: ClientsApiService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  get filteredClients() {
    const normalized = this.query.toLowerCase();
    return this.clients.filter((client) =>
      [client.nome ?? client.name, client.email ?? "", client.cpf ?? "", client.telefone ?? client.phone].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    );
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get activeClients(): number {
    return this.clients.filter((client) => (client.statusSerasa ?? client.status) !== "NEGATIVADO").length;
  }

  get blockedClients(): number {
    return this.clients.filter((client) => (client.statusSerasa ?? client.status) === "NEGATIVADO").length;
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

  openCreateModal(): void {
    this.modalMode = "create";
    this.form = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(client: Client): void {
    this.modalMode = "edit";
    this.form = {
      id: client.id,
      nome: client.nome ?? client.name,
      cpf: client.cpf ?? "",
      email: client.email ?? "",
      telefone: client.telefone ?? client.phone,
      endereco: client.endereco ?? client.address,
      statusSerasa: client.statusSerasa ?? client.status,
      debtStatus: client.debtStatus,
      ticket: client.ticket,
    };
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
  }

  submitForm(): void {
    const normalizedClient: Client = {
      id: this.form.id ?? this.generateNextId(),
      initials: this.getInitials(this.form.nome),
      nome: this.form.nome.trim(),
      cpf: this.form.cpf.trim(),
      telefone: this.form.telefone.trim(),
      endereco: this.form.endereco.trim(),
      statusSerasa: this.form.statusSerasa,
      name: this.form.nome.trim(),
      email: this.form.email.trim() || null,
      phone: this.form.telefone.trim(),
      address: this.form.endereco.trim(),
      status: this.form.statusSerasa,
      debtStatus: this.form.debtStatus,
      ticket: Number(this.form.ticket),
    };

    if (!normalizedClient.nome || !normalizedClient.cpf || !normalizedClient.telefone || !normalizedClient.endereco) {
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.clientsApiService.updateClient(normalizedClient).subscribe({
        next: (updatedClient) => {
          this.clients = this.clients.map((client) =>
            client.id === this.form.id ? updatedClient : client,
          );
          this.closeModal();
        },
        error: () => this.saveClientLocally(normalizedClient),
      });
    } else {
      this.clientsApiService.createClient(normalizedClient).subscribe({
        next: (createdClient) => {
          this.clients = [createdClient, ...this.clients];
          this.closeModal();
        },
        error: () => this.saveClientLocally(normalizedClient),
      });
    }
  }

  deleteClient(clientId: number): void {
    this.clientsApiService.deleteClient(clientId).subscribe({
      next: () => this.removeClientLocally(clientId),
      error: () => this.removeClientLocally(clientId),
    });
  }

  private loadClients(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.isUsingFallbackData = false;
    this.fallbackMessage = "";

    this.clientsApiService.listClients().subscribe({
      next: (clients) => {
        this.clients = clients.map((client) => this.clientsApiService.normalizeClient(client));
        this.isLoading = false;
      },
      error: () => {
        this.clients = mockClients.map((client) => this.clientsApiService.normalizeClient(client));
        this.isUsingFallbackData = true;
        this.fallbackMessage = "API de clientes indisponivel no momento. Exibindo dados locais para continuarmos a validacao da tela.";
        this.isLoading = false;
      },
    });
  }

  private getEmptyForm(): ClientForm {
    return {
      id: null,
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      endereco: "",
      statusSerasa: "REGULAR",
      debtStatus: "Em dia",
      ticket: 0,
    };
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  private generateNextId(): number {
    return this.clients.reduce((max, client) => Math.max(max, client.id), 0) + 1;
  }

  private saveClientLocally(client: Client): void {
    const normalizedClient = this.clientsApiService.normalizeClient(client);

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.clients = this.clients.map((currentClient) =>
        currentClient.id === this.form.id ? normalizedClient : currentClient,
      );
    } else {
      this.clients = [normalizedClient, ...this.clients];
    }

    this.isUsingFallbackData = true;
    this.fallbackMessage =
      "API de clientes indisponivel. Alteracao aplicada localmente para manter a validacao da tela.";
    this.closeModal();
  }

  private removeClientLocally(clientId: number): void {
    this.clients = this.clients.filter((client) => client.id !== clientId);
  }
}
