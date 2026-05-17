import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Client } from "../../core/models";
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
  isModalOpen = false;
  modalMode: "create" | "edit" = "create";
  readonly formatCurrency = formatCurrency;
  serasaConsultedCpf = "";
  isConsultingSerasa = false;
  serasaMessage = "Informe o CPF e consulte o status antes de salvar.";
  form: ClientForm = this.getEmptyForm();

  constructor(
    private readonly clientsApiService: ClientsApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

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
    this.resetSerasaState();
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
      ticket: client.ticket,
    };
    this.serasaConsultedCpf = this.form.cpf;
    this.serasaMessage = "Status recuperado do cadastro atual.";
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
    this.resetSerasaState();
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
      debtStatus: this.form.statusSerasa === "NEGATIVADO" ? "Bloqueado" : "Em dia",
      ticket: Number(this.form.ticket),
    };

    if (!normalizedClient.nome || !normalizedClient.cpf || !normalizedClient.telefone || !normalizedClient.endereco) {
      return;
    }

    if (!this.hasValidSerasaCheck()) {
      this.showPersistenceError("Consulte o CPF no Serasa fake antes de salvar o cliente.");
      return;
    }

    if (this.modalMode === "edit" && this.form.id !== null) {
      this.clientsApiService.updateClient(normalizedClient).subscribe({
        next: () => {
          this.closeModal();
          this.loadClients();
        },
        error: () => this.showPersistenceError("Nao foi possivel atualizar o cliente na API."),
      });
    } else {
      this.clientsApiService.createClient(normalizedClient).subscribe({
        next: () => {
          this.closeModal();
          this.loadClients();
        },
        error: () => this.showPersistenceError("Nao foi possivel cadastrar o cliente na API."),
      });
    }
  }

  deleteClient(clientId: number): void {
    this.clientsApiService.deleteClient(clientId).subscribe({
      next: () => this.loadClients(),
      error: () => this.showPersistenceError("Nao foi possivel excluir o cliente na API."),
    });
  }

  consultSerasa(): void {
    const cpfDigits = this.form.cpf.replace(/\D/g, "");

    if (cpfDigits.length !== 11) {
      this.form.statusSerasa = "REGULAR";
      this.serasaConsultedCpf = "";
      this.serasaMessage = "CPF deve ter 11 digitos para consulta fake.";
      return;
    }

    this.isConsultingSerasa = true;
    this.serasaMessage = "Consultando status Serasa fake...";

    window.setTimeout(() => {
      const lastDigit = Number(cpfDigits.at(-1));
      const isNegativado = [0, 3, 7].includes(lastDigit);

      this.form.statusSerasa = isNegativado ? "NEGATIVADO" : "REGULAR";
      this.serasaConsultedCpf = this.form.cpf;
      this.serasaMessage = isNegativado
        ? "Consulta fake retornou CPF com restricao."
        : "Consulta fake retornou CPF regular.";
      this.isConsultingSerasa = false;
    }, 450);
  }

  onCpfChange(): void {
    if (this.form.cpf !== this.serasaConsultedCpf) {
      this.form.statusSerasa = "REGULAR";
      this.serasaMessage = "CPF alterado. Consulte novamente antes de salvar.";
    }
  }

  private loadClients(): void {
    console.info("[clientes] carregando lista da API");
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.clientsApiService.listClients().subscribe({
      next: (clients) => {
        this.ngZone.run(() => {
          this.clients = clients.map((client) => this.clientsApiService.normalizeClient(client));
          this.isLoading = false;
          console.info("[clientes] lista carregada", this.clients.length);
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.clients = [];
          this.errorMessage = "API de clientes indisponivel. Nao ha fallback mockado nesta tela.";
          this.isLoading = false;
          console.error("[clientes] falha ao carregar lista");
          this.changeDetectorRef.detectChanges();
        });
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

  private showPersistenceError(message: string): void {
    this.errorMessage = message;
  }

  private hasValidSerasaCheck(): boolean {
    return this.form.cpf.trim().length > 0 && this.form.cpf === this.serasaConsultedCpf;
  }

  private resetSerasaState(): void {
    this.serasaConsultedCpf = "";
    this.isConsultingSerasa = false;
    this.serasaMessage = "Informe o CPF e consulte o status antes de salvar.";
  }
}
