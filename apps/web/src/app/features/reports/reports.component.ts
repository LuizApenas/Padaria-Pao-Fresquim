import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ReportsApiService, SalesReport } from "../../core/services/reports-api.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-reports",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.css"
})
export class ReportsComponent implements OnInit {
  dataInicio = "";
  dataFim = "";
  isLoading = true;
  errorMessage = "";
  report: SalesReport = this.getEmptyReport();
  readonly formatCurrency = formatCurrency;

  constructor(
    private readonly reportsApiService: ReportsApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadReport();
  }

  get growthLabel(): string {
    const values = this.report.dailySales;

    if (values.length < 2) {
      return "0%";
    }

    const midpoint = Math.floor(values.length / 2);
    const previous = values.slice(0, midpoint).reduce((sum, item) => sum + item.value, 0);
    const current = values.slice(midpoint).reduce((sum, item) => sum + item.value, 0);

    if (previous <= 0) {
      return current > 0 ? "+100%" : "0%";
    }

    const growth = ((current - previous) / previous) * 100;

    return `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
  }

  get maxDailyValue(): number {
    return Math.max(...this.report.dailySales.map((item) => item.value), 1);
  }

  getBarHeight(value: number): number {
    return Math.max((value / this.maxDailyValue) * 180, 20);
  }

  applyFilters(): void {
    this.loadReport();
  }

  retry(): void {
    this.loadReport();
  }

  private loadReport(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.reportsApiService.getSalesReport({
      dataInicio: this.dataInicio,
      dataFim: this.dataFim,
    }).subscribe({
      next: (report) => {
        this.ngZone.run(() => {
          this.report = report;
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.report = this.getEmptyReport();
          this.errorMessage = "API de relatorios indisponivel. Nao ha fallback mockado nesta tela.";
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      },
    });
  }

  private getEmptyReport(): SalesReport {
    return {
      totalSold: 0,
      totalOrders: 0,
      averageTicket: 0,
      dailySales: [],
      topProducts: [],
    };
  }
}
