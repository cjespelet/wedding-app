import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface RsvpInfo {
  id: string;
  attending: boolean;
  numberOfGuests: number;
}

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private http = inject(HttpClient);

  getCurrentRsvp(): Observable<RsvpInfo> {
    return this.http.get<RsvpInfo>(`${environment.apiBaseUrl}/rsvp/current`);
  }

  confirmRsvp(adults: number, minors: number): Observable<RsvpInfo> {
    return this.http.post<RsvpInfo>(`${environment.apiBaseUrl}/rsvp`, {
      attending: true,
      numberOfGuests: adults + minors,
    });
  }
}

