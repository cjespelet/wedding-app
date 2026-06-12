import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface WeddingInfo {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  story?: string;
  instructions?: string;
}

@Injectable({
  providedIn: 'root',
})
export class WeddingService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/wedding`;
  }

  getWeddingBySlug(slug: string) {
    return this.http.get<WeddingInfo>(`${this.apiUrl}/${slug}`);
  }

  getOwnWedding() {
    return this.http.get<WeddingInfo>(this.apiUrl);
  }

  updateWedding(payload: Partial<WeddingInfo>) {
    return this.http.put<WeddingInfo>(this.apiUrl, payload);
  }
}

