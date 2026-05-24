import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Employee } from "../../core/models";
import { ApiErrorMessageService } from "../../core/services/api-error-message.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { EmployeePayload, EmployeesApiService } from "../../core/services/employees-api.service";
import { ToastService } from "../../core/services/toast.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";

type EmployeeRole = EmployeePayload["role"];

type EmployeeForm = {
  id: number | null;
  nome: string;
  cpf: string;
  telefone: string;
  endereco: string;
  matricula: string;
  cargo: string;
  dataAdmissao: string;
  contatoEmergencia: string;
  role: EmployeeRole;
  email: string;
  senha: string;
};

@Component({
  selector: "pf-employees",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: "./employees.component.html",
  styleUrl: "./employees.component.css"
})
export class EmployeesComponent implements OnInit {
  private readonly router = inject(Router);

  query = "";
  employees: Employee[] = [];
  isLoading = true;
  errorMessage = "";
  modalErrorMessage = "";
  isModalOpen = false;
  selectedEmployee: Employee | null = null;
  modalMode: "create" | "edit" = "create";
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  readonly roles: EmployeeRole[] = ["PROPRIETARIO", "ATENDENTE", "PADEIRO"];
  form: EmployeeForm = this.getEmptyForm();

  constructor(
    private readonly employeesApiService: EmployeesApiService,
    private readonly confirmService: ConfirmService,
    private readonly toastService: ToastService,
    private readonly apiErrorMessageService: ApiErrorMessageService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  get filteredEmployees(): Employee[] {
    return this.employees;
  }

  get totalEmployees(): number {
    return this.totalItems;
  }

  get activeEmployees(): number {
    return this.employees.filter((employee) => employee.status === "Ativo").length;
  }

  get attendanceRegistered(): number {
    return this.employees.filter((employee) => (employee.registrosPonto?.length ?? 0) > 0).length;
  }

  get vacationRecords(): number {
    return this.employees.reduce((total, employee) => total + (employee.ferias?.length ?? 0), 0);
  }

  retry(): void {
    this.loadEmployees();
  }

  searchEmployees(): void {
    this.currentPage = 1;
    this.loadEmployees();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.loadEmployees();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.loadEmployees();
  }

  openCreateModal(): void {
    this.modalMode = "create";
    this.form = this.getEmptyForm();
    this.modalErrorMessage = "";
    this.isModalOpen = true;
  }

  openEditModal(employee: Employee): void {
    this.modalMode = "edit";
    this.form = {
      id: employee.id,
      nome: employee.nome ?? employee.name,
      cpf: employee.cpf ?? "",
      telefone: employee.telefone ?? "",
      endereco: employee.endereco ?? "",
      matricula: employee.matricula ?? "",
      cargo: employee.cargo ?? employee.role,
      dataAdmissao: this.toDateInput(employee.dataAdmissao),
      contatoEmergencia: employee.contatoEmergencia ?? "",
      role: employee.accessRole ?? "ATENDENTE",
      email: employee.email ?? "",
      senha: "",
    };
    this.modalErrorMessage = "";
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.form = this.getEmptyForm();
    this.modalErrorMessage = "";
  }

  submitForm(): void {
    if (!this.isFormValid()) {
      this.showModalError("Preencha todos os campos obrigatorios antes de cadastrar o funcionario.");
      return;
    }

    if (this.form.senha.trim() && !this.isStrongPassword(this.form.senha.trim())) {
      this.showModalError("Senha invalida. Use no minimo 10 caracteres com letra maiuscula, letra minuscula, numero e caractere especial.");
      return;
    }

    const payload = this.toPayload();

    if (this.modalMode === "edit" && this.form.id !== null) {
      const updatePayload: Partial<EmployeePayload> = { ...payload };

      if (!this.form.senha.trim()) {
        delete updatePayload.senha;
      }

      this.employeesApiService.updateEmployee(this.form.id, updatePayload).subscribe({
        next: () => {
          this.closeModal();
          this.loadEmployees();
          this.toastService.show(`Funcionario ${payload.nome || ""} atualizado.`, "success");
        },
        error: (error) => {
          const msg = this.apiErrorMessageService.describe(error, "Nao foi possivel atualizar o funcionario.");
          this.showModalError(msg);
          this.toastService.show(msg, "danger");
        },
      });
      return;
    }

    this.employeesApiService.createEmployee(payload).subscribe({
      next: () => {
        this.closeModal();
        this.loadEmployees();
        this.toastService.show(`Funcionario ${payload.nome || ""} cadastrado.`, "success");
      },
      error: (error) => {
        const msg = this.apiErrorMessageService.describe(error, "Nao foi possivel cadastrar o funcionario.");
        this.showModalError(msg);
        this.toastService.show(msg, "danger");
      },
    });
  }

  async deleteEmployee(employee: Employee): Promise<void> {
    const confirmed = await this.confirmService.ask({
      title: "Excluir funcionario?",
      message: `${employee.nome ?? employee.name} sera removido do cadastro. Verifique antes se nao existem vendas, ponto ou documentos vinculados.`,
      confirmLabel: "Excluir funcionario",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const employeeId = employee.id;
    this.employeesApiService.deleteEmployee(employeeId).subscribe({
      next: () => {
        this.loadEmployees();
        this.toastService.show("Funcionario excluido.", "success");
      },
      error: (error) => this.showPersistenceError(this.apiErrorMessageService.describe(error, "Nao foi possivel excluir o funcionario.")),
    });
  }

  openOperations(employee: Employee): void {
    this.selectedEmployee = employee;
  }

  closeOperations(): void {
    this.selectedEmployee = null;
  }

  goToTimecard(): void {
    if (!this.selectedEmployee) {
      return;
    }

    const employeeId = this.selectedEmployee.id;
    this.closeOperations();
    void this.router.navigate(["/funcionarios", employeeId, "ponto"]);
  }

  goToDocuments(): void {
    if (!this.selectedEmployee) {
      return;
    }

    const employeeId = this.selectedEmployee.id;
    this.closeOperations();
    void this.router.navigate(["/funcionarios", employeeId, "documentos"]);
  }

  formatRole(role?: string): string {
    const labels: Record<string, string> = {
      PROPRIETARIO: "Proprietario",
      ATENDENTE: "Atendente",
      PADEIRO: "Padeiro",
    };

    return labels[role ?? ""] ?? "Atendente";
  }

  private loadEmployees(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.employeesApiService.listEmployees({
      busca: this.query,
      page: this.currentPage,
      limit: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.employees = response.data.map((employee) => this.employeesApiService.normalizeEmployee(employee));
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.employees = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.errorMessage = "API de funcionarios indisponivel. Nao ha fallback mockado nesta tela.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private getEmptyForm(): EmployeeForm {
    return {
      id: null,
      nome: "",
      cpf: "",
      telefone: "",
      endereco: "",
      matricula: "",
      cargo: "",
      dataAdmissao: new Date().toISOString().slice(0, 10),
      contatoEmergencia: "",
      role: "ATENDENTE",
      email: "",
      senha: "",
    };
  }

  private toPayload(): EmployeePayload {
    return {
      nome: this.form.nome.trim(),
      cpf: this.form.cpf.trim(),
      telefone: this.form.telefone.trim(),
      endereco: this.form.endereco.trim(),
      matricula: this.form.matricula.trim(),
      cargo: this.form.cargo.trim(),
      dataAdmissao: this.form.dataAdmissao,
      contatoEmergencia: this.form.contatoEmergencia.trim(),
      role: this.form.role,
      email: this.form.email.trim(),
      senha: this.form.senha.trim(),
      ativo: true,
    };
  }

  private isFormValid(): boolean {
    const requiredValues = [
      this.form.nome,
      this.form.cpf,
      this.form.telefone,
      this.form.endereco,
      this.form.matricula,
      this.form.cargo,
      this.form.dataAdmissao,
      this.form.contatoEmergencia,
      this.form.role,
      this.form.email,
    ];

    return requiredValues.every((value) => value.trim().length > 0) && (this.modalMode === "edit" || this.form.senha.trim().length > 0);
  }

  private isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password);
  }

  private toDateInput(date?: string): string {
    if (!date) {
      return new Date().toISOString().slice(0, 10);
    }

    return new Date(date).toISOString().slice(0, 10);
  }

  private showPersistenceError(message: string): void {
    this.errorMessage = message;
  }

  private showModalError(message: string): void {
    this.modalErrorMessage = message;
    this.changeDetectorRef.detectChanges();
  }
}
