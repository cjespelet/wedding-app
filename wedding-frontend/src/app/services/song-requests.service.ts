import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface SongRequest {
  id: string;
  title: string;
  artist: string;
  comment?: string | null;
  played: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class SongRequestsService {
  private http = inject(HttpClient);

  listMy(): Observable<SongRequest[]> {
    return this.http.get<SongRequest[]>(`${environment.apiBaseUrl}/songs/my`);
  }

  create(payload: { title: string; artist?: string; comment?: string | null }): Observable<SongRequest> {
    return this.http.post<SongRequest>(`${environment.apiBaseUrl}/songs`, payload);
  }
}

