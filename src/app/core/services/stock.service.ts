import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { CommittedStockItem, InventoryStatementItem } from '../../features/stock/models/stock.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/stock`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  getCommittedStock(itemCode: string): Observable<CommittedStockItem[]> {
    const params = new HttpParams().set('itemCode', itemCode);

    return this.http.get<CommittedStockItem[]>(`${this.apiUrl}/committed`, { params });
  }

  getInventoryStatement(): Observable<InventoryStatementItem[]> {
    return this.http.get<InventoryStatementItem[]>(`${this.apiUrl}/statement`);
  }
}
