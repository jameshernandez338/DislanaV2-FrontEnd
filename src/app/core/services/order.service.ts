import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { OrderResponse } from '../../features/cart/models/order-response.model';

export interface OrderItemPayload {
  CodigoItem: string;
  Cantidad1: number;
  CantidadB: number;
  Pvp: number;
  PvpB: number;
}

export interface OrderPayload {
  Orillo: string;
  Items: OrderItemPayload[];
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/orders`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  placeOrder(payload: OrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/save`, payload);
  }
}
