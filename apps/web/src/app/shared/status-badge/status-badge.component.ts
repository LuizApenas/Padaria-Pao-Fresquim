import { Component, Input } from "@angular/core";
import { NgClass } from "@angular/common";
import { getStatusTone } from "../../core/utils/format";

@Component({
  selector: "pf-status-badge",
  standalone: true,
  imports: [NgClass],
  templateUrl: "./status-badge.component.html",
  styleUrl: "./status-badge.component.css"
})
export class StatusBadgeComponent {
  @Input({ required: true }) text = "";
  @Input() tone?: "success" | "warning" | "danger" | "info";

  get resolvedTone(): string {
    return this.tone ?? getStatusTone(this.text);
  }
}
