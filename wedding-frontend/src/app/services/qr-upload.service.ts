import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface QrUploadStatus {
  ok: boolean;
  brideName: string;
  groomName: string;
  uploaderLabel: string;
}

export interface QrUploadResponse {
  uploaded: number;
  photos: unknown[];
}

@Injectable({ providedIn: 'root' })
export class QrUploadService {
  private readonly weddingSlug = environment.weddingSlug;

  constructor(private http: HttpClient) {}

  checkStatus(token: string): Observable<QrUploadStatus> {
    const params = new HttpParams().set('w', token).set('slug', this.weddingSlug);
    return this.http.get<QrUploadStatus>(`${environment.apiBaseUrl}/gallery/qr-upload/status`, {
      params,
    });
  }

  uploadPhotos(token: string, files: File[]): Observable<QrUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file, file.name));
    const params = new HttpParams().set('w', token).set('slug', this.weddingSlug);
    return this.http.post<QrUploadResponse>(`${environment.apiBaseUrl}/gallery/upload-qr`, formData, {
      params,
    });
  }
}
