import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { reports, weeklySales } from "../../core/mock-data";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-reports",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./reports.component.html",
  styleUrl: "./reports.component.css"
})
export class ReportsComponent {
  readonly reports = reports;
  readonly weeklySales = weeklySales;
  readonly formatCurrency = formatCurrency;
}
