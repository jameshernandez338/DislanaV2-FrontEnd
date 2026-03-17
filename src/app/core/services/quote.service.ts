import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { QuoteCustomerBalance, QuoteItem } from '../../features/quote/models/quote.model';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/quote`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  getQuotes(): Observable<QuoteItem[]> {
    return this.http.get<QuoteItem[]>(`${this.apiUrl}/list`);
  }

  getCustomerBalance(): Observable<QuoteCustomerBalance> {
    return this.http.get<QuoteCustomerBalance>(`${this.apiUrl}/customer-balance`);
  }
}
