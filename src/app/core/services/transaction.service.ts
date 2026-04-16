import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { TransactionItem } from '../../features/transactions/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/transaction`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  getTransactions(): Observable<TransactionItem[]> {
    return this.http.get<TransactionItem[]>(`${this.apiUrl}/list`);
  }
}
