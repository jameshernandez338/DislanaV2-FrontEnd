import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { AccountStatementItem, AccountStatementDetailDto } from '../../features/account-statement/models/account-statement.model';

@Injectable({ providedIn: 'root' })
export class AccountStatementService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/account-statement`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  getAccountStatement(startDate: Date, endDate: Date, documentType?: string): Observable<AccountStatementItem[]> {
    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    if (documentType) {
      params = params.set('documentType', documentType);
    }

    return this.http.get<AccountStatementItem[]>(this.apiUrl, { params });
  }

  getAccountStatementDetail(documentNumber: string): Observable<AccountStatementDetailDto[]> {
    return this.http.get<AccountStatementDetailDto[]>(`${this.apiUrl}/detail/${documentNumber}`);
  }
}
