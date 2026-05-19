import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();
  const handleUnauthorized = (error: { status?: number }) => {
    if (error.status === 401 && !request.url.includes("/api/auth/login")) {
      authService.logout();
      void router.navigateByUrl("/login");
    }

    return throwError(() => error);
  };

  if (!token) {
    return next(request).pipe(catchError(handleUnauthorized));
  }

  return next(request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  })).pipe(catchError(handleUnauthorized));
};
