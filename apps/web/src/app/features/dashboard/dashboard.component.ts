import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { alerts, overview, weeklySales } from "../../core/mock-data";
import { StorageService } from "../../core/services/storage.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css"
})
export class DashboardComponent {
  readonly alerts = alerts;
  readonly overview = overview;
  readonly weeklySales = weeklySales;
  readonly sales = this.storageService.getSales();
  readonly formatCurrency = formatCurrency;
  readonly monthlySales = [
    { day: "S1", value: 4120 },
    { day: "S2", value: 5380 },
    { day: "S3", value: 4860 },
    { day: "S4", value: 6210 }
  ];
  selectedPeriod: "semana" | "mes" = "semana";
  hoveredIndex: number | null = null;

  constructor(private readonly storageService: StorageService) {}

  get chartData() {
    return this.selectedPeriod === "semana" ? this.weeklySales : this.monthlySales;
  }

  get chartSubtitle(): string {
    return this.selectedPeriod === "semana"
      ? "Vendas dos ultimos 7 dias"
      : "Vendas consolidadas nas ultimas 4 semanas";
  }

  setPeriod(period: "semana" | "mes"): void {
    this.selectedPeriod = period;
    this.hoveredIndex = null;
  }

  setHoveredIndex(index: number | null): void {
    this.hoveredIndex = index;
  }

  getBarHeight(value: number): number {
    const max = Math.max(...this.chartData.map((item) => item.value));
    const normalized = (value / max) * 255;
    return normalized < 64 ? 64 : normalized;
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }
}
