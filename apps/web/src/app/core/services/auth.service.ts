import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, tap } from "rxjs";
import { API_BASE_URL } from "../config/api-base-url";
const TOKEN_KEY = "pao-fresquim-auth-token";
const REFRESH_TOKEN_KEY = "pao-fresquim-auth-refresh-token";
const USER_KEY = "pao-fresquim-auth-user";

export type AuthUser = {
  id: number | null;
  nome: string;
  email: string;
  role: "PROPRIETARIO" | "ATENDENTE" | "PADEIRO";
  cargo: string;
  supabaseUserId?: string;
};

export type LoginResponse = {
  token: string;
  refreshToken?: string;
  expiresIn?: number;
  usuario: AuthUser;
};

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  login(email: string, senha: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/api/auth/login`, { email, senha })
      .pipe(tap((response) => this.persistSession(response)));
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/api/auth/password/recover`, {
      email,
      redirectTo: `${window.location.origin}/login`,
    });
  }

  updatePassword(token: string, senha: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${API_BASE_URL}/api/auth/password/update`, {
      token,
      senha,
    });
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    const rawUser = localStorage.getItem(USER_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private persistSession(response: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));

    if (response.refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }
  }
}
