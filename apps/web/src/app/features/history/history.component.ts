import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { Employee, Sale } from "../../core/models";
import { ApiErrorMessageService } from "../../core/services/api-error-message.service";
import { AuthService } from "../../core/services/auth.service";
import { ConfirmService } from "../../core/services/confirm.service";
import { EmployeesApiService } from "../../core/services/employees-api.service";
import { SalesApiService } from "../../core/services/sales-api.service";
import { ToastService } from "../../core/services/toast.service";
import { formatCurrency } from "../../core/utils/format";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";

@Component({
  selector: "pf-history",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, StatusBadgeComponent],
  templateUrl: "./history.component.html",
  styleUrl: "./history.component.css"
})
export class HistoryComponent implements OnInit {
  sales: Sale[] = [];
  employees: Employee[] = [];
  startDate = "";
  endDate = "";
  selectedEmployeeId = "";
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  isLoading = true;
  errorMessage = "";
  summary = {
    totalSold: 0,
    averageTicket: 0,
    canceledSales: 0,
    activeOperators: 0,
  };
  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly salesApiService: SalesApiService,
    private readonly employeesApiService: EmployeesApiService,
    private readonly authService: AuthService,
    private readonly confirmService: ConfirmService,
    private readonly toastService: ToastService,
    private readonly apiErrorMessageService: ApiErrorMessageService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadSales();
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadSales();
  }

  retry(): void {
    this.loadSales();
  }

  previousPage(): void {
    if (this.currentPage <= 1) {
      return;
    }

    this.currentPage -= 1;
    this.loadSales();
  }

  nextPage(): void {
    if (this.currentPage >= this.totalPages) {
      return;
    }

    this.currentPage += 1;
    this.loadSales();
  }

  get canCancelSales(): boolean {
    return this.authService.getUser()?.role === "PROPRIETARIO";
  }

  async cancelSale(sale: Sale): Promise<void> {
    if (!this.canCancelSales) {
      this.errorMessage = "Seu perfil de atendente nao pode cancelar vendas. Solicite o cancelamento ao proprietario.";
      this.toastService.show("Apenas proprietarios podem cancelar vendas.", "warning");
      return;
    }

    const confirmed = await this.confirmService.ask({
      title: "Cancelar venda?",
      message: `A venda #${sale.id} sera marcada como cancelada e os valores sairao dos relatorios ativos.`,
      confirmLabel: "Cancelar venda",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    const saleId = sale.id;
    this.salesApiService.cancelSale(saleId).subscribe({
      next: () => {
        this.loadSales();
        this.toastService.show("Venda cancelada.", "success");
      },
      error: (error) => {
        this.errorMessage = this.apiErrorMessageService.describe(error, "Nao foi possivel cancelar a venda.");
        this.toastService.show("Venda nao foi cancelada. Verifique a mensagem na tela.", "danger");
      },
    });
  }

  private loadSales(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.salesApiService.listSales({
      inicio: this.startDate,
      fim: this.endDate,
      funcionarioId: this.selectedEmployeeId,
      page: this.currentPage,
      limit: this.pageSize,
    }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.sales = response.data;
          this.summary = response.summary;
          this.totalItems = response.pagination.total;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.page;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.sales = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.summary = {
            totalSold: 0,
            averageTicket: 0,
            canceledSales: 0,
            activeOperators: 0,
          };
          this.errorMessage = "Nao consegui carregar as vendas. Verifique se a API esta rodando e tente novamente.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private loadEmployees(): void {
    this.employeesApiService.listEmployees({ limit: 100 }).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          this.employees = response.data;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => undefined,
    });
  }
}
