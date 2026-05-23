import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ConfirmService } from "../../core/services/confirm.service";

@Component({
  selector: "pf-confirm-dialog",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./confirm-dialog.component.html",
  styleUrl: "./confirm-dialog.component.css",
})
export class ConfirmDialogComponent {
  readonly confirmService = inject(ConfirmService);
}
