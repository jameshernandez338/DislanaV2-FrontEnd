import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppConfig } from './app-config.model';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly http: HttpClient;
  private config: AppConfig | null = null;

  constructor(httpBackend: HttpBackend) {
    // Bypass interceptors to avoid auth/config bootstrap cycles.
    this.http = new HttpClient(httpBackend);
  }

  async load(): Promise<void> {
    const config = await firstValueFrom(
      this.http.get<AppConfig>('/config.json')
    );

    this.config = {
      ...config,
      apiBaseUrl: config.apiBaseUrl.replace(/\/+$/, ''),
    };
  }

  get apiBaseUrl(): string {
    if (!this.config) {
      throw new Error('App configuration has not been loaded yet.');
    }

    return this.config.apiBaseUrl;
  }
}
