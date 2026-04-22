import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SKIP_AUTH_REFRESH } from './auth-context.token';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const shouldSkipRefresh = req.context.get(SKIP_AUTH_REFRESH);

  const isAuthRequest =
    req.url.includes('/api/auth/login') ||
    req.url.includes('/api/auth/forgot-password') ||
    req.url.includes('/api/auth/refresh-token');  
  
  const token = authService.getToken();
  
  if (token && !isAuthRequest && !shouldSkipRefresh) {
    const exp = (authService as any).getTokenExpirationTime(token);

    if (exp && exp <= Date.now()) {
      //token expirado, refrescar antes de enviar request
      return authService.refreshToken().pipe(
        switchMap((response) => {
          const newRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.token}`
            }
          });
          return next(newRequest);
        }),
        catchError((error) => {
          authService.logout(false);
          return throwError(() => error);
        })
      );
    }

    //token válido, usarlo normal
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        !authService.getToken() ||
        shouldSkipRefresh ||
        isAuthRequest
      ) {
        return throwError(() => error);
      }

      //evita múltiples refresh simultáneos (ya lo maneja el service)
      return authService.refreshToken().pipe(
        switchMap((response) => {
          const retryRequest = req.clone({
            setHeaders: {
              Authorization: `Bearer ${response.token}`
            }
          });

          return next(retryRequest);
        }),
        catchError((refreshError) => {
          authService.logout(false);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
