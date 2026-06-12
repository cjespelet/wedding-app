import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  comment?: string;
  played: boolean;
  voteCount?: number;
}

@Injectable({
  providedIn: 'root',
})
export class DjService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/dj`;
  }

  createRequest(title: string, artist: string, comment?: string) {
    return this.http.post(`${this.apiUrl}/request`, { title, artist, comment });
  }

  vote(requestId: string) {
    return this.http.post(`${this.apiUrl}/vote/${requestId}`, {});
  }

  getRequestsForDj() {
    return this.http.get<SongRequest[]>(`${this.apiUrl}/requests`);
  }

  markPlayed(requestId: string) {
    return this.http.post(`${this.apiUrl}/played/${requestId}`, {});
  }
}

