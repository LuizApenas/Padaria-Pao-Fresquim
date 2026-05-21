import { ApplicationConfig, LOCALE_ID } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { PadariaPreset } from "./theme/padaria-preset";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: PadariaPreset,
        options: {
          darkModeSelector: false,
        },
      },
    }),
    { provide: LOCALE_ID, useValue: "pt-BR" },
  ],
};
