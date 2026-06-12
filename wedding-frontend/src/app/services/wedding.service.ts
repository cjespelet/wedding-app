import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface WeddingInfo {
  id: string;
  slug: string;
  brideName: string;
  groomName: string;
  date: string;
  time: string;
  location: string;
  description?: string | null;
  story?: string | null;
  instructions?: string | null;
  coverImageUrl?: string | null;
  allowPhotoSharing?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class WeddingService {
  private http = inject(HttpClient);

  getCurrentWedding(): Observable<WeddingInfo> {
    return this.http.get<WeddingInfo>(`${environment.apiBaseUrl}/wedding/current`);
  }
}

