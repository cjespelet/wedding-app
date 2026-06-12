import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Photo {
  id: string;
  weddingId: string;
  originalUrl: string;
  largeUrl: string;
  mediumUrl: string;
  squareUrl: string;
  highlighted: boolean;
  approved: boolean;
  likes: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/gallery`;
  }

  getWeddingPhotos(weddingId: string) {
    return this.http.get<Photo[]>(`${this.apiUrl}/${weddingId}`);
  }

  uploadPhotos(weddingId: string, files: FileList) {
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('photos', file));
    // weddingId is carried in JWT; included here if you later adapt API
    return this.http.post(`${this.apiUrl}/upload?weddingId=${encodeURIComponent(weddingId)}`, formData);
  }
}

