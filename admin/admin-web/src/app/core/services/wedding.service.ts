import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { catchError, map, of } from 'rxjs';

export interface WeddingInfo {
  id: string;
  brideName: string;
  groomName: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  story?: string;
  instructions?: string;
  allowPhotoSharing: boolean;
  maxSharesPerGuest: number;
  allowQrUpload: boolean;
  qrUploadToken?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class WeddingService {
  constructor(private http: HttpClient) {}

  getWedding() {
    return this.http
      .get<WeddingInfo | WeddingInfo[]>(`${environment.apiBaseUrl}/wedding`)
      .pipe(
        map((resp) => (Array.isArray(resp) ? resp[0] ?? null : resp)),
        catchError(() => of(null)),
      );
  }

  updateWedding(payload: Partial<WeddingInfo>) {
    return this.http
      .put<WeddingInfo | WeddingInfo[]>(`${environment.apiBaseUrl}/wedding`, payload)
      .pipe(map((resp) => (Array.isArray(resp) ? resp[0] : resp)));
  }

  regenerateQrUploadToken() {
    return this.http.post<{ qrUploadToken: string; allowQrUpload: boolean }>(
      `${environment.apiBaseUrl}/admin/qr-upload/regenerate-token`,
      {},
    );
  }
}

