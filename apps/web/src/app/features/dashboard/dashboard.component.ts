import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { RouterLink } from "@angular/router";
import { Sale } from "../../core/models";
import { DashboardReport, DailySalesReport, ReportsApiService } from "../../core/services/reports-api.service";
import { SalesApiService } from "../../core/services/sales-api.service";
import { formatCurrency } from "../../core/utils/format";
import {
  aggregateDailyByWeek,
  dailyToChartPoints,
  SalesChartPoint,
} from "../../core/utils/sales-chart-aggregation";
import { SalesChartComponent } from "../../shared/sales-chart/sales-chart.component";
import { isoDateNDaysAgoBr, todayIsoBr } from "../../core/utils/br-date";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";

type DashboardAlert = {
  title: string;
  body: string;
  tone: "yellow" | "red" | "orange";
};

@Component({
  selector: "pf-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent, SalesChartComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css"
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardReport = {
    totalSoldToday: 0,
    salesCount: 0,
    averageTicket: 0,
    debtClients: 0,
    comparedToYesterday: 0,
  };
  weekSales: DailySalesReport[] = [];
  monthSales: DailySalesReport[] = [];
  sales: Sale[] = [];
  isLoading = true;
  errorMessage = "";
  readonly formatCurrency = formatCurrency;
  selectedPeriod: "semana" | "mes" = "semana";

  constructor(
    private readonly reportsApiService: ReportsApiService,
    private readonly salesApiService: SalesApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  get alerts(): DashboardAlert[] {
    return [
      {
        title: "Fiado em aberto",
        body: `${this.dashboard.debtClients} cliente(s) com saldo de fiado pendente.`,
        tone: this.dashboard.debtClients > 0 ? "yellow" : "orange",
      },
      {
        title: "Vendas canceladas",
        body: "Acompanhe cancelamentos pela tela de historico ate criarmos acao dedicada.",
        tone: "red",
      },
      {
        title: "Autenticacao pendente",
        body: "Nova venda ainda usa funcionario fixo ate JWT retornar o operador logado.",
        tone: "orange",
      },
    ];
  }

  get chartPoints(): SalesChartPoint[] {
    if (this.selectedPeriod === "semana") {
      return dailyToChartPoints(this.weekSales);
    }

    return aggregateDailyByWeek(this.monthSales);
  }

  get chartSubtitle(): string {
    return this.selectedPeriod === "semana"
      ? "Vendas dos ultimos 7 dias"
      : "Vendas consolidadas dos ultimos 30 dias";
  }

  get chartTotal(): number {
    return this.chartPoints.reduce((sum, item) => sum + item.value, 0);
  }

  get chartAverage(): number {
    if (!this.chartPoints.length) {
      return 0;
    }

    return Number((this.chartTotal / this.chartPoints.length).toFixed(2));
  }

  get chartPeak(): SalesChartPoint {
    if (!this.chartPoints.length) {
      return { key: "", label: "-", value: 0, orders: 0 };
    }

    return this.chartPoints.reduce((highest, current) =>
      current.value > highest.value ? current : highest,
    );
  }

  get comparedToYesterdayLabel(): string {
    const value = this.dashboard.comparedToYesterday;

    return `${value >= 0 ? "+" : ""}${value.toFixed(0)}%`;
  }

  retry(): void {
    this.loadDashboard();
  }

  setPeriod(period: "semana" | "mes"): void {
    this.selectedPeriod = period;
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }

  private loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    let pending = 4;
    let hasFailure = false;

    const finish = () => {
      pending -= 1;

      if (pending === 0) {
        this.ngZone.run(() => {
          this.isLoading = false;

          if (hasFailure) {
            this.errorMessage = "API do dashboard indisponivel. Nao ha fallback mockado nesta tela.";
          }

          this.changeDetectorRef.detectChanges();
          // Chart.js needs a second pass after async data binds to the chart component.
          setTimeout(() => this.changeDetectorRef.detectChanges(), 0);
        });
      }
    };

    this.reportsApiService.getDashboardReport().subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
        finish();
      },
      error: () => {
        hasFailure = true;
        finish();
      },
    });

    this.reportsApiService.getSalesReport(this.getDateRange(6)).subscribe({
      next: (report) => {
        this.weekSales = report.dailySales;
        finish();
      },
      error: () => {
        hasFailure = true;
        finish();
      },
    });

    this.reportsApiService.getSalesReport(this.getDateRange(29)).subscribe({
      next: (report) => {
        this.monthSales = report.dailySales;
        finish();
      },
      error: () => {
        hasFailure = true;
        finish();
      },
    });

    this.salesApiService.listSales({ page: 1, limit: 3 }).subscribe({
      next: (response) => {
        this.sales = response.data;
        finish();
      },
      error: () => {
        hasFailure = true;
        finish();
      },
    });
  }

  private getDateRange(daysBack: number): { dataInicio: string; dataFim: string } {
    return {
      dataInicio: isoDateNDaysAgoBr(daysBack),
      dataFim: todayIsoBr(),
    };
  }
}
