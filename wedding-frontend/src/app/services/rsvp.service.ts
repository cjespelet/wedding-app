import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface RsvpInfo {
  id: string;
  attending: boolean;
  numberOfGuests: number;
  confirmedAdults?: number | null;
  confirmedMinors?: number | null;
}

export interface RsvpDefaults {
  adults: number;
  minors: number;
}

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private http = inject(HttpClient);

  getCurrentRsvp(): Observable<RsvpInfo> {
    return this.http.get<RsvpInfo>(`${environment.apiBaseUrl}/rsvp/current`);
  }

  getDefaults(): Observable<RsvpDefaults> {
    return this.http.get<RsvpDefaults>(`${environment.apiBaseUrl}/rsvp/defaults`);
  }

  confirmRsvp(adults: number, minors: number): Observable<RsvpInfo> {
    return this.http.post<RsvpInfo>(`${environment.apiBaseUrl}/rsvp`, {
      attending: true,
      adults,
      minors,
    });
  }
}
