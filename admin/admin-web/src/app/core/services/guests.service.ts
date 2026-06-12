import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface GuestRsvp {
  attending: boolean;
  numberOfGuests: number;
}

export interface Guest {
  id: string;
  fullName: string;
  familyGroup?: string;
  email?: string;
  adultsCount: number;
  minorsCount: number;
  username?: string;
  accessCode?: string;
  qrCode: string;
  checkedIn: boolean;
  checkedInTime?: string;
  rsvps?: GuestRsvp[];
  canSharePhotos: boolean;
  photoSharesCount: number;
}

/** Último RSVP del invitado: confirma presencia y cantidad que confirma */
export function lastRsvp(guest: Guest): GuestRsvp | null {
  const list = guest.rsvps;
  if (!list?.length) return null;
  return list[0];
}

@Injectable({
  providedIn: 'root',
})
export class GuestsService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<Guest[]>(`${environment.apiBaseUrl}/admin/guests`);
  }

  create(payload: CreateGuestPayload) {
    return this.http.post<Guest>(`${environment.apiBaseUrl}/admin/guests`, payload);
  }

  update(id: string, payload: UpdateGuestPayload) {
    return this.http.put<Guest>(`${environment.apiBaseUrl}/admin/guests/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<void>(`${environment.apiBaseUrl}/admin/guests/${id}`);
  }

  checkinByQr(qr_code: string) {
    return this.http.post(`${environment.apiBaseUrl}/checkin`, { qr_code });
  }
}

export interface CreateGuestPayload {
  fullName: string;
  familyGroup?: string;
  email?: string;
  adultsCount?: number;
  minorsCount?: number;
  username?: string;
  accessCode?: string;
}

export interface UpdateGuestPayload {
  fullName?: string;
  familyGroup?: string;
  email?: string;
  adultsCount?: number;
  minorsCount?: number;
  username?: string;
  accessCode?: string;
  canSharePhotos?: boolean;
}

