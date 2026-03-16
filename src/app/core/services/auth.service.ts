import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthResponse } from '../../features/auth/models/auth-response.model';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { RegisterRequest } from '../../features/auth/models/register-request.model';
import { ForgotPasswordRequest } from '../../features/auth/models/forgot-password-request.model';
import { AppConfigService } from '../config/app-config.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/auth`;
  }

  private _token = signal<string | null>(null);
  token$ = this._token.asReadonly();

  constructor(
    private http: HttpClient,
    private router: Router,
    private appConfig: AppConfigService
  ) {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      this._token.set(storedToken);
    }
  }

  login(request: LoginRequest) {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      request
    );
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

  setSession(token: string) {
    localStorage.setItem('token', token);
    this._token.set(token);
  }

  logout() {
    localStorage.removeItem('token');
    this._token.set(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!this._token();
  }

  getToken(): string | null {
    return this._token();
  }
}
