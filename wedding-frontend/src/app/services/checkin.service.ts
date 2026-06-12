import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

interface CheckinResponse {
  success: boolean;
  alreadyCheckedIn?: boolean;
}

export interface CheckinStatus {
  checkedIn: boolean;
  checkedInTime?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CheckinService {
  constructor(private http: HttpClient) {}

  checkinFromQr(code: string): Observable<CheckinResponse> {
    return this.http.post<CheckinResponse>(`${environment.apiBaseUrl}/checkin/from-guest`, { code });
  }

  // Check-in público (sin login) usando QR de la puerta / recepción.
  // Espera que el QR contenga el `qrCode` del invitado (Guest.qrCode).
  checkinFromQrCode(qrCode: string): Observable<CheckinResponse> {
    return this.http.post<CheckinResponse>(`${environment.apiBaseUrl}/checkin`, { qr_code: qrCode });
  }

  getStatus(): Observable<CheckinStatus> {
    return this.http.get<CheckinStatus>(`${environment.apiBaseUrl}/checkin/status`);
  }
}

