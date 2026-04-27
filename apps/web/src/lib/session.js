import { LOGIN_EMAIL, LOGIN_PASSWORD } from "../data/mockData";

const AUTH_KEY = "pao-fresquim-auth";

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function login(email, password) {
  const valid = email.trim().toLowerCase() === LOGIN_EMAIL && password.trim() === LOGIN_PASSWORD;
  if (valid) {
    localStorage.setItem(AUTH_KEY, "true");
  }
  return valid;
}

export function logout() {
  localStorage.removeItem(AUTH_KEY);
}
