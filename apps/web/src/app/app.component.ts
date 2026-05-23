import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { ConfirmDialogComponent } from "./shared/confirm-dialog/confirm-dialog.component";
import { ToastStackComponent } from "./shared/toast-stack/toast-stack.component";

@Component({
  selector: "pf-root",
  standalone: true,
  imports: [RouterOutlet, ConfirmDialogComponent, ToastStackComponent],
  template: `
    <router-outlet></router-outlet>
    <pf-confirm-dialog />
    <pf-toast-stack />
  `,
})
export class AppComponent {}
