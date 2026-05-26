import { DOCUMENT } from "@angular/common";
import { Injectable, effect, inject, signal } from "@angular/core";

export type ThemeMode = "light" | "dark" | "contrast";

const THEME_STORAGE_KEY = "pf_theme_mode";
const DEFAULT_THEME_MODE: ThemeMode = "light";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    effect(() => {
      const root = this.document.documentElement;
      const body = this.document.body;
      const currentMode = this.mode();

      root.classList.toggle("theme-dark", currentMode === "dark");
      root.classList.toggle("theme-contrast", currentMode === "contrast");
      body.classList.toggle("theme-dark", currentMode === "dark");
      body.classList.toggle("theme-contrast", currentMode === "contrast");
      localStorage.setItem(THEME_STORAGE_KEY, currentMode);
    });
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  isMode(mode: ThemeMode): boolean {
    return this.mode() === mode;
  }

  private readStoredMode(): ThemeMode {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);

    if (storedMode === "dark" || storedMode === "contrast" || storedMode === "light") {
      return storedMode;
    }

    return DEFAULT_THEME_MODE;
  }
}
