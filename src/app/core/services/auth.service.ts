import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, shareReplay, tap, throwError } from 'rxjs';
import { AuthResponse } from '../../features/auth/models/auth-response.model';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { RegisterRequest } from '../../features/auth/models/register-request.model';
import { ForgotPasswordRequest } from '../../features/auth/models/forgot-password-request.model';
import { AppConfigService } from '../config/app-config.service';
import { SKIP_AUTH_REFRESH } from '../interceptors/auth-context.token';
import { CartService } from './cart.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private static readonly REFRESH_OFFSET_MS = 60_000;

  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/auth`;
  }

  private _token = signal<string | null>(null);
  private _fullName = signal<string | null>(null);
  private refreshTokenRequest$: Observable<AuthResponse> | null = null;
  private refreshTimeoutId: ReturnType<typeof setTimeout> | null = null;
  token$ = this._token.asReadonly();
  fullName$ = this._fullName.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
    private appConfig: AppConfigService,
    private cartService: CartService
  ) {
    const storedToken = localStorage.getItem('token');
    const storedFullName = localStorage.getItem('fullName');

    if (storedToken) {
      this._token.set(storedToken);
      this.scheduleTokenRefresh(storedToken);
    }

    if (storedFullName) {
      this._fullName.set(storedFullName);
    }
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      request,
      {
        withCredentials: true
      }
    );
  }

  refreshToken() {
    if (!this.getToken()) {
      return throwError(() => new Error('No active session'));
    }

    if (!this.refreshTokenRequest$) {
      this.refreshTokenRequest$ = this.http.post<AuthResponse>(
        `${this.apiUrl}/refresh-token`,
        {},
        {
          withCredentials: true,
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true)
        }
      ).pipe(
        tap((response) => {
          this.setSession(response.token, response.fullName);
        }),
        catchError((error) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => {
          this.refreshTokenRequest$ = null;
        }),
        shareReplay(1)
      );
    }

    return this.refreshTokenRequest$;
  }

  register(request: RegisterRequest) {
    return this.http.post<void>(
      `${this.apiUrl}/register`,
      request
    );
  }

  forgotPassword(request: ForgotPasswordRequest) {
    return this.http.post<void>(
      `${this.apiUrl}/forgot-password`,
      request
    );
  }

  setSession(token: string, fullName: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('fullName', fullName);
    this._token.set(token);
    this._fullName.set(fullName);
    this.scheduleTokenRefresh(token);
  }

  logout(notifyServer = true) {
    if (notifyServer && this.getToken()) {
      this.http.post(
        `${this.apiUrl}/logout`,
        {},
        {
          withCredentials: true,
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true)
        }
      ).pipe(
        finalize(() => {
          this.finishLogout();
        })
      ).subscribe({
        error: () => {
          // Local logout still completes even if the backend call fails.
        }
      });
      return;
    }

    this.finishLogout();
  }

  isAuthenticated(): boolean {
    return !!this._token();
  }

  getToken(): string | null {
    return this._token();
  }

  getFullName(): string {
    return this._fullName() || '';
  }

  private scheduleTokenRefresh(token: string) {
    this.clearRefreshTimeout();

    const expirationTime = this.getTokenExpirationTime(token);

    if (!expirationTime) {
      return;
    }

    const refreshInMs = expirationTime - Date.now() - AuthService.REFRESH_OFFSET_MS;

    if (refreshInMs <= 0) {
      this.refreshToken().subscribe({
        error: () => {
          this.logout(false);
        }
      });
      return;
    }

    this.refreshTimeoutId = setTimeout(() => {
      this.refreshToken().subscribe({
        error: () => {
          this.logout(false);
        }
      });
    }, refreshInMs);
  }

  private getTokenExpirationTime(token: string): number | null {
    try {
      const payload = token.split('.')[1];

      if (!payload) {
        return null;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = atob(normalizedPayload);
      const { exp } = JSON.parse(decodedPayload) as { exp?: number };

      if (!exp) {
        return null;
      }

      return exp * 1000;
    } catch {
      return null;
    }
  }

  private clearRefreshTimeout() {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  private clearSession() {
    this.clearRefreshTimeout();
    this.cartService.clear();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('fullName');
    this._token.set(null);
    this._fullName.set(null);
  }

  private finishLogout() {
    this.clearSession();
    this.router.navigate(['/login']);
  }
}
