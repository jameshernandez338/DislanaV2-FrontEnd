import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfigService } from '../config/app-config.service';

export interface ChatMessageRequest {
  sessionId: string;
  message: string;
}

export interface ChatMessageResponse {
  message: string;
  offerPdf: boolean;
  pdfType: string | null;
  type: string;
}

export interface GeneratePdfReportRequest {
  tipo: string;
  sessionId?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatAssistantService {
  private get apiUrl(): string {
    return `${this.appConfig.apiBaseUrl}/api/chat-assistant`;
  }

  constructor(
    private http: HttpClient,
    private appConfig: AppConfigService
  ) {}

  sendMessage(request: ChatMessageRequest): Observable<ChatMessageResponse> {
    return this.http.post<ChatMessageResponse>(this.apiUrl, request);
  }

  generatePdf(request: GeneratePdfReportRequest): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/generate-pdf`, request, {
      responseType: 'blob'
    });
  }
}
