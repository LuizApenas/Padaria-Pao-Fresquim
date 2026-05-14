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
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
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
  readonly statusOptions = ["Ativo", "Bloqueado", "VIP", "Inativo"];
  readonly debtStatusOptions = ["Em dia", "Fiado ativo", "Bloqueado", "Critico", "Acompanhando"];
  form: ClientForm = this.getEmptyForm();

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

  openCreateModal(): void {
    this.modalMode = "create";
    this.form = this.getEmptyForm();
    this.isModalOpen = true;
  }

  openEditModal(client: Client): void {
    this.modalMode = "edit";
    this.form = {
      id: client.id,
      name: client.name,
      email: client.email ?? "",
      phone: client.phone,
      address: client.address,
      status: client.status,
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
      initials: this.getInitials(this.form.name),
      name: this.form.name.trim(),
      email: this.form.email.trim() || null,
      phone: this.form.phone.trim(),
      address: this.form.address.trim(),
      status: this.form.status,
      debtStatus: this.form.debtStatus,
      ticket: Number(this.form.ticket),
    };

    if (!normalizedClient.name || !normalizedClient.phone || !normalizedClient.address) {
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.clients = this.clients.map((client) =>
        client.id === this.form.id ? normalizedClient : client,
      );
    } else {
      this.clients = [normalizedClient, ...this.clients];
    }

    this.closeModal();
  }

  deleteClient(clientId: number): void {
    this.clients = this.clients.filter((client) => client.id !== clientId);
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

  private getEmptyForm(): ClientForm {
    return {
      id: null,
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "Ativo",
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
}
