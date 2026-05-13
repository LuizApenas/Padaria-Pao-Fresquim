import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { clients } from "../../core/mock-data";
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-clients",
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: "./clients.component.html",
  styleUrl: "./clients.component.css"
})
export class ClientsComponent {
  query = "";
  readonly clients = clients;
  readonly formatCurrency = formatCurrency;

  get filteredClients() {
    const normalized = this.query.toLowerCase();
    return this.clients.filter((client) =>
      [client.name, client.email, client.phone].some((value) => value.toLowerCase().includes(normalized))
    );
  }
}
