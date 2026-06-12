import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface RsvpPayload {
  attending: boolean;
  numberOfGuests: number;
  dietaryRestrictions?: string;
  comments?: string;
}

export interface RsvpStats {
  totalGuests: number;
  confirmedGuests: number;
}

@Injectable({
  providedIn: 'root',
})
export class RsvpService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/rsvp`;
  }

  submitRsvp(payload: RsvpPayload) {
    return this.http.post(this.apiUrl, payload);
  }

  getStats() {
    return this.http.get<RsvpStats>(`${this.apiUrl}/stats`);
  }
}

