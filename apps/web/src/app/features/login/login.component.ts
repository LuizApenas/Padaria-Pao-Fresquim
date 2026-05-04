import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LOGIN_EMAIL, LOGIN_PASSWORD, overview } from "../../core/mock-data";
import { AuthService } from "../../core/services/auth.service";
import { formatCurrency } from "../../core/utils/format";

@Component({
  selector: "pf-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css"
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  email = "";
  password = "";
  error = "";
  readonly loginEmail = LOGIN_EMAIL;
  readonly loginPassword = LOGIN_PASSWORD;
  readonly totalSoldToday = formatCurrency(overview.totalSoldToday);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl("/dashboard");
    }
  }

  submit(): void {
    if (this.authService.login(this.email, this.password)) {
      this.router.navigateByUrl("/dashboard");
      return;
    }

    this.error = "Credenciais invalidas. Use arthur@email.com e 1234.";
  }
}
