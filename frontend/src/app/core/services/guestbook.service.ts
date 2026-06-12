import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface GuestbookMessage {
  id: string;
  weddingId: string;
  guestId?: string;
  name: string;
  message: string;
  emoji?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class GuestbookService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/guestbook`;
  }

  list(weddingId: string) {
    return this.http.get<GuestbookMessage[]>(`${this.apiUrl}/${weddingId}`);
  }

  post(message: { name: string; message: string; emoji?: string }) {
    return this.http.post<GuestbookMessage>(this.apiUrl, message);
  }
}

