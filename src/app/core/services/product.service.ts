import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';
import { ProductFilterItem, ProductListItem } from '../../features/home/models/home-filter.model';
import { ProductDetailDto } from '../../features/products/models/product-detail.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/products`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  getFilters(type: string): Observable<ProductFilterItem[]> {
    const params = new HttpParams().set('type', type);

    return this.http.get<ProductFilterItem[]>(`${this.apiUrl}/filters`, { params });
  }

  getProducts(type: string): Observable<ProductListItem[]> {
    const params = new HttpParams().set('type', type);

    return this.http.get<ProductListItem[]>(`${this.apiUrl}/list`, { params });
  }

  getProductDetail(codigoItem: string): Observable<ProductDetailDto> {
    const params = new HttpParams().set('itemCode', codigoItem);

    return this.http.get<ProductDetailDto>(`${this.apiUrl}/detail`, { params });
  }
}
