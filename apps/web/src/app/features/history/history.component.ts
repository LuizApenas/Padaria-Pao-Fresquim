import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { StorageService } from "../../core/services/storage.service";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-history",
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: "./history.component.html",
  styleUrl: "./history.component.css"
})
export class HistoryComponent {
  readonly sales = this.storageService.getSales();
  readonly formatCurrency = formatCurrency;

  constructor(private readonly storageService: StorageService) {}
}
