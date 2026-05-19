import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

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
  newPassword = "";
  error = "";
  success = "";
  isSubmitting = false;
  isResetMode = false;
  recoveryToken = "";

  constructor() {
    this.recoveryToken = this.getRecoveryTokenFromUrl();
    this.isResetMode = Boolean(this.recoveryToken);

    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl("/dashboard");
    }
  }

  submit(): void {
    if (!this.email.trim() || !this.password.trim()) {
      this.error = "Informe e-mail e senha.";
      return;
    }

    this.isSubmitting = true;
    this.error = "";
    this.success = "";

    this.authService.login(this.email.trim(), this.password).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigateByUrl("/dashboard");
      },
      error: () => {
        this.isSubmitting = false;
        this.error = "Credenciais invalidas ou usuario sem funcionario ativo vinculado.";
      },
    });
  }

  requestPasswordReset(): void {
    if (!this.email.trim()) {
      this.error = "Informe o e-mail para redefinir a senha.";
      return;
    }

    this.isSubmitting = true;
    this.error = "";
    this.success = "";

    this.authService.requestPasswordReset(this.email.trim()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.success = response.message;
      },
      error: () => {
        this.isSubmitting = false;
        this.error = "Nao foi possivel solicitar redefinicao de senha.";
      },
    });
  }

  updatePassword(): void {
    if (!this.recoveryToken || !this.isStrongPassword(this.newPassword)) {
      this.error = "Use uma senha com minimo 10 caracteres, maiuscula, minuscula, numero e especial.";
      return;
    }

    this.isSubmitting = true;
    this.error = "";
    this.success = "";

    this.authService.updatePassword(this.recoveryToken, this.newPassword).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.success = "Senha atualizada. Faca login com a nova senha.";
        this.isResetMode = false;
        this.recoveryToken = "";
        this.newPassword = "";
      },
      error: () => {
        this.isSubmitting = false;
        this.error = "Nao foi possivel atualizar a senha. Solicite um novo link.";
      },
    });
  }

  private getRecoveryTokenFromUrl(): string {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const queryParams = new URLSearchParams(window.location.search);

    return hashParams.get("access_token") ?? queryParams.get("access_token") ?? "";
  }

  private isStrongPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{10,}$/.test(password);
  }
}
