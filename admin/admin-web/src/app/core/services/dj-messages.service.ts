import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DjRequest {
  id: string;
  title: string;
  artist: string;
  comment: string | null;
  createdAt: string;
  played: boolean;
  voteCount: number;
  guestName: string | null;
  guestUsername: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DjMessagesService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<DjRequest[]>(`${environment.apiBaseUrl}/dj/requests`);
  }

  markPlayed(id: string) {
    return this.http.post<DjRequest>(`${environment.apiBaseUrl}/dj/played/${id}`, {});
  }

  createAdminRequest(payload: { title: string; artist: string; comment?: string | null }) {
    return this.http.post<DjRequest>(`${environment.apiBaseUrl}/dj/admin-request`, payload);
  }
}

