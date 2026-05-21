// apps/web/src/app/shared/sales-chart/sales-chart.component.ts
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  Chart,
  ChartConfiguration,
  registerables,
  type TooltipItem,
} from "chart.js";
import { CHART_BRAND } from "../../core/chart-brand";
import { SalesChartPoint } from "../../core/utils/sales-chart-aggregation";
import { formatCurrency } from "../../core/utils/format";

Chart.register(...registerables);

@Component({
  selector: "pf-sales-chart",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./sales-chart.component.html",
  styleUrl: "./sales-chart.component.css",
})
export class SalesChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild("canvas") canvasRef?: ElementRef<HTMLCanvasElement>;

  @Input() points: SalesChartPoint[] = [];
  @Input() highlightIndex: number | null = null;

  private chart?: Chart<"bar">;
  private viewReady = false;
  private resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this.viewReady = true;

    const host = this.canvasRef?.nativeElement?.parentElement;

    if (host && typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.resize();
          return;
        }

        this.scheduleRender();
      });
      this.resizeObserver.observe(host);
    }

    this.scheduleRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["points"] || changes["highlightIndex"]) {
      this.scheduleRender();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.destroy();
  }

  private scheduleRender(): void {
    if (!this.viewReady) {
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.renderChart());
    });
  }

  private renderChart(): void {
    const canvas = this.canvasRef?.nativeElement;

    if (!canvas) {
      return;
    }

    const container = canvas.parentElement;

    if (!container || container.clientHeight < 40) {
      return;
    }

    this.chart?.destroy();
    this.chart = undefined;

    if (!this.points.length) {
      return;
    }

    const peakIndex = this.points.findIndex(
      (item) => item.value === Math.max(...this.points.map((p) => p.value), 0),
    );

    const config: ChartConfiguration<"bar"> = {
      type: "bar",
      data: {
        labels: this.points.map((item) => this.axisLabel(item)),
        datasets: [
          {
            label: "Vendas",
            data: this.points.map((item) => item.value),
            backgroundColor: (context) => {
              const index = context.dataIndex ?? 0;
              return this.barGradient(canvas, index === peakIndex || index === this.highlightIndex);
            },
            hoverBackgroundColor: (context) => {
              const index = context.dataIndex ?? 0;
              return this.barGradient(canvas, true);
            },
            borderRadius: {
              topLeft: 12,
              topRight: 12,
              bottomLeft: 4,
              bottomRight: 4,
            },
            borderSkipped: false,
            maxBarThickness: 56,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        datasets: {
          bar: {
            categoryPercentage: 0.72,
            barPercentage: 0.88,
          },
        },
        layout: {
          padding: { top: 8, right: 12, left: 4, bottom: 4 },
        },
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: CHART_BRAND.tooltipBg,
            borderColor: CHART_BRAND.tooltipBorder,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 10,
            titleColor: "#f8fafc",
            bodyColor: "#cbd5e1",
            titleFont: { size: 13, weight: "bold", family: "'Segoe UI', system-ui, sans-serif" },
            bodyFont: { size: 12, family: "'Segoe UI', system-ui, sans-serif" },
            callbacks: {
              title: (items: TooltipItem<"bar">[]) => {
                const point = this.points[items[0]?.dataIndex ?? 0];
                return point?.hint ?? point?.label ?? "";
              },
              label: (item: TooltipItem<"bar">) => {
                const point = this.points[item.dataIndex];
                if (!point) {
                  return "";
                }

                return [
                  `Receita: ${formatCurrency(point.value)}`,
                  `Pedidos: ${point.orders}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: CHART_BRAND.tickStrong,
              font: { size: 10, weight: "bold", family: "'Segoe UI', system-ui, sans-serif" },
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 14,
              padding: 10,
            },
          },
          y: {
            beginAtZero: true,
            border: { display: false, dash: [4, 4] },
            grid: {
              color: CHART_BRAND.grid,
              lineWidth: 1,
            },
            ticks: {
              color: CHART_BRAND.tick,
              font: { size: 11, family: "'Segoe UI', system-ui, sans-serif" },
              padding: 10,
              callback: (value) => this.shortCurrency(Number(value)),
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
    this.chart.resize();
  }

  private barGradient(canvas: HTMLCanvasElement, peak: boolean): CanvasGradient | string {
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return peak ? CHART_BRAND.barPeakBottom : CHART_BRAND.barMutedBottom;
    }

    const height = canvas.parentElement?.clientHeight ?? 280;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    if (peak) {
      gradient.addColorStop(0, CHART_BRAND.barPeakTop);
      gradient.addColorStop(1, CHART_BRAND.barPeakBottom);
      return gradient;
    }

    gradient.addColorStop(0, CHART_BRAND.barMutedTop);
    gradient.addColorStop(1, CHART_BRAND.barMutedBottom);
    return gradient;
  }

  private axisLabel(item: SalesChartPoint): string | string[] {
    if (!item.subLabel) {
      return item.label;
    }

    return [item.label, item.subLabel];
  }

  private shortCurrency(value: number): string {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }

    return `R$ ${value.toFixed(0)}`;
  }
}
