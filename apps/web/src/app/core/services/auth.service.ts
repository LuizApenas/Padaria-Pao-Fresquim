import { Injectable } from "@angular/core";
import { LOGIN_EMAIL, LOGIN_PASSWORD } from "../mock-data";

const AUTH_KEY = "pao-fresquim-auth";

@Injectable({ providedIn: "root" })
export class AuthService {
  isAuthenticated(): boolean {
    return localStorage.getItem(AUTH_KEY) === "true";
  }

  login(email: string, password: string): boolean {
    const valid =
      email.trim().toLowerCase() === LOGIN_EMAIL &&
      password.trim() === LOGIN_PASSWORD;

    if (valid) {
      localStorage.setItem(AUTH_KEY, "true");
    }

    return valid;
  }

  logout(): void {
    localStorage.removeItem(AUTH_KEY);
  }
}
