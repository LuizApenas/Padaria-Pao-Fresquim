// apps/web/src/app/theme/padaria-preset.ts
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

/** PrimeNG preset tuned to Padaria Pao Fresquim greens and slate surfaces. */
export const PadariaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "#e8f5ef",
      100: "#cdebd9",
      200: "#9dd9b8",
      300: "#5fc492",
      400: "#2da86c",
      500: "#1a6b45",
      600: "#155a3a",
      700: "#124c31",
      800: "#0f3f29",
      900: "#0c3322",
      950: "#071f14",
    },
    colorScheme: {
      light: {
        surface: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#eef2f6",
          200: "#e2e8f0",
          300: "#dbe3ee",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#0d1117",
        },
      },
    },
  },
});
