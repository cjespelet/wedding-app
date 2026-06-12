import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface GuestWithRsvp {
  id: string;
  fullName: string;
  familyGroup?: string;
  email?: string;
  rsvps: {
    attending: boolean;
    numberOfGuests: number;
    createdAt: string;
  }[];
}

export interface AdminAnalytics {
  confirmedGuests: number;
  totalGuests: number;
  songRequests: number;
  photos: number;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly http = inject(HttpClient);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/admin`;
  }

  getGuests() {
    return this.http.get<GuestWithRsvp[]>(`${this.apiUrl}/guests`);
  }

  getAnalytics() {
    return this.http.get<AdminAnalytics>(`${this.apiUrl}/analytics`);
  }
}

