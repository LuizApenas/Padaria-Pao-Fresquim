// apps/web/src/app/features/reports/reports.component.ts
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, NgZone, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ReportsApiService, SalesReport } from "../../core/services/reports-api.service";
import { formatCurrency } from "../../core/utils/format";
import { isoDateNDaysAgoBr, startOfCurrentMonthIsoBr, todayIsoBr } from "../../core/utils/br-date";
import {
  aggregateDailyByMonth,
  aggregateDailyByWeek,
  dailyToChartPoints,
  SalesChartPoint,
} from "../../core/utils/sales-chart-aggregation";
import { SalesChartComponent } from "../../shared/sales-chart/sales-chart.component";

type Preset = "hoje" | "semana" | "mes" | "custom";
export type ChartView = "daily" | "weekly" | "monthly";

@Component({
  selector: "pf-reports",
  standalone: true,
  imports: [CommonModule, FormsModule, SalesChartComponent],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.css",
})
export class ReportsComponent implements OnInit {
  dataInicio = "";
  dataFim = "";
  activePreset: Preset = "mes";
  chartView: ChartView = "daily";
  isLoading = true;
  errorMessage = "";
  report: SalesReport = this.getEmptyReport();
  readonly formatCurrency = formatCurrency;

  readonly presets: { id: Preset; label: string }[] = [
    { id: "hoje", label: "Hoje" },
    { id: "semana", label: "Esta semana" },
    { id: "mes", label: "Este mes" },
    { id: "custom", label: "Personalizado" },
  ];

  readonly chartViews: { id: ChartView; label: string }[] = [
    { id: "daily", label: "Diario" },
    { id: "weekly", label: "Semanal" },
    { id: "monthly", label: "Mensal" },
  ];

  constructor(
    private readonly reportsApiService: ReportsApiService,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.applyPreset("mes");
  }

  get growthLabel(): string {
    const values = this.report.dailySales;

    if (values.length < 2) {
      return "–";
    }

    const midpoint = Math.floor(values.length / 2);
    const previous = values.slice(0, midpoint).reduce((sum, item) => sum + item.value, 0);
    const current = values.slice(midpoint).reduce((sum, item) => sum + item.value, 0);

    if (previous <= 0) {
      return current > 0 ? "+100%" : "–";
    }

    const growth = ((current - previous) / previous) * 100;

    return `${growth >= 0 ? "+" : ""}${growth.toFixed(0)}%`;
  }

  get growthPositive(): boolean {
    return this.growthLabel.startsWith("+");
  }

  get growthNegative(): boolean {
    return this.growthLabel.startsWith("-");
  }

  get chartSubtitle(): string {
    if (this.chartView === "weekly") {
      return "Receita agregada por semana ISO no periodo";
    }
    if (this.chartView === "monthly") {
      return "Receita agregada por mes calendario no periodo";
    }
    return "Receita diaria no periodo selecionado";
  }

  get chartBars(): SalesChartPoint[] {
    const daily = this.report.dailySales;

    if (this.chartView === "weekly") {
      return aggregateDailyByWeek(daily);
    }

    if (this.chartView === "monthly") {
      return aggregateDailyByMonth(daily);
    }

    return dailyToChartPoints(daily);
  }

  get maxProductSales(): number {
    return Math.max(...this.report.topProducts.map((item) => item.sales), 1);
  }

  setChartView(view: ChartView): void {
    this.chartView = view;
  }

  getProductBarWidth(sales: number): number {
    return Math.round((sales / this.maxProductSales) * 100);
  }

  applyPreset(preset: Preset): void {
    this.activePreset = preset;
    const today = todayIsoBr();

    if (preset === "hoje") {
      this.dataInicio = today;
      this.dataFim = today;
    } else if (preset === "semana") {
      this.dataInicio = isoDateNDaysAgoBr(6);
      this.dataFim = today;
    } else if (preset === "mes") {
      this.dataInicio = startOfCurrentMonthIsoBr();
      this.dataFim = today;
    }

    if (preset !== "custom") {
      this.loadReport();
    }
  }

  applyCustom(): void {
    this.activePreset = "custom";
    this.loadReport();
  }

  retry(): void {
    this.loadReport();
  }

  private loadReport(): void {
    this.isLoading = true;
    this.errorMessage = "";
    this.changeDetectorRef.detectChanges();

    this.reportsApiService
      .getSalesReport({
        dataInicio: this.dataInicio,
        dataFim: this.dataFim,
      })
      .subscribe({
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
            this.errorMessage =
              "API de relatorios indisponivel. Verifique autenticacao e backend.";
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
