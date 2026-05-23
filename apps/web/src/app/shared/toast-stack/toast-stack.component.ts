import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { ToastMessage, ToastService } from "../../core/services/toast.service";

@Component({
  selector: "pf-toast-stack",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./toast-stack.component.html",
  styleUrl: "./toast-stack.component.css",
})
export class ToastStackComponent {
  readonly toastService = inject(ToastService);

  runAction(message: ToastMessage): void {
    message.action?.run();
    this.toastService.dismiss(message.id);
  }
}
