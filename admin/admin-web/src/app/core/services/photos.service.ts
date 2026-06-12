import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Photo {
  id: string;
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
export class PhotosService {
  constructor(private http: HttpClient) {}

  listAdminPhotos() {
    return this.http.get<Photo[]>(`${environment.apiBaseUrl}/admin/photos`);
  }

  uploadFormData(formData: FormData) {
    return this.http.post(`${environment.apiBaseUrl}/gallery/upload`, formData);
  }

  approve(id: string) {
    return this.http.patch(`${environment.apiBaseUrl}/admin/photos/${id}`, { approved: true });
  }

  toggleHighlight(id: string, highlighted: boolean) {
    return this.http.patch(`${environment.apiBaseUrl}/admin/photos/${id}`, { highlighted });
  }

  remove(id: string) {
    return this.http.delete(`${environment.apiBaseUrl}/admin/photos/${id}`);
  }
}

