import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { map, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

export interface GuestGroup {
  id: string;
  name: string;
}

export interface InvitePreview {
  id: string;
  fullName: string;
  displayName: string;
}

export interface GuestUser {
  id: string;
  name: string;
  username: string;
  groupId?: string;
}

interface LoginResponse {
  token: string;
  user: GuestUser;
}

/** Respuesta cruda del backend (guest o user) */
interface AuthLoginRaw {
  token: string;
  user?: GuestUser & { weddingId?: string };
  guest?: { id: string; name: string; username?: string | null; weddingId: string };
}

interface RegisterPayload {
  name: string;
  username?: string;
  password: string;
  groupId: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly tokenKey = 'guest_jwt';
  private readonly userKey = 'guest_user';

  private http = inject(HttpClient);
  private router = inject(Router);

  login(username: string, password: string): Observable<LoginResponse> {
    if ((environment as any).apiBaseUrl) {
      return this.http
        .post<AuthLoginRaw>(`${(environment as any).apiBaseUrl}/auth/login`, {
          username,
          password,
        })
        .pipe(
          map((raw) => this.normalizeLoginResponse(raw)),
          tap((res) => this.storeSession(res)),
        );
    }

    // Mocked login for initial development
    const mockUser: GuestUser = {
      id: 'mock-id',
      name: 'Invitado',
      username,
    };
    const mockResponse: LoginResponse = {
      token: 'mock-token',
      user: mockUser,
    };
    return of(mockResponse).pipe(tap((res) => this.storeSession(res)));
  }

  register(data: RegisterPayload): Observable<LoginResponse> {
    if ((environment as any).apiBaseUrl) {
      return this.http
        .post<AuthLoginRaw>(`${(environment as any).apiBaseUrl}/auth/register`, data)
        .pipe(
          map((raw) => this.normalizeLoginResponse(raw)),
          tap((res) => this.storeSession(res)),
        );
    }

    // Mocked register: immediately "logs in" the user
    const mockUser: GuestUser = {
      id: 'mock-id',
      name: data.name,
      username: data.username?.trim() ?? 'invitado',
      groupId: data.groupId,
    };
    const mockResponse: LoginResponse = {
      token: 'mock-token',
      user: mockUser,
    };
    return of(mockResponse).pipe(tap((res) => this.storeSession(res)));
  }

  getGuestGroups(): Observable<GuestGroup[]> {
    if ((environment as any).apiBaseUrl) {
      // Endpoint público simplificado para la app de invitados
      return this.http
        .get<any[]>(`${(environment as any).apiBaseUrl}/admin/guests-public`)
        .pipe(
          map((guests) =>
            guests.map((g) => ({
              id: g.id,
              // Usamos primero el grupo/familia, luego el nombre completo como fallback
              name: g.familyGroup || g.fullName || g.username || 'Invitado',
            })),
          ),
        );
    }

    // Mocked groups for selector en caso de no tener API configurada
    const mockGroups: GuestGroup[] = [
      { id: '1', name: 'Juan Pérez' },
      { id: '2', name: 'Familia García' },
      { id: '3', name: 'Mesa 5' },
    ];
    return of(mockGroups);
  }

  getInvitePreview(guestId: string): Observable<InvitePreview> {
    return this.http.get<InvitePreview>(
      `${(environment as any).apiBaseUrl}/auth/invite/${encodeURIComponent(guestId)}`,
    );
  }

  private normalizeLoginResponse(raw: AuthLoginRaw): LoginResponse {
    if (raw.user) {
      return {
        token: raw.token,
        user: {
          id: raw.user.id,
          name: raw.user.name,
          username: raw.user.username ?? '',
          groupId: raw.user.groupId,
        },
      };
    }
    if (raw.guest) {
      return {
        token: raw.token,
        user: {
          id: raw.guest.id,
          name: raw.guest.name,
          username: raw.guest.username ?? '',
        },
      };
    }
    return { token: raw.token, user: { id: '', name: '', username: '' } };
  }

  storeSession(res: LoginResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
  }

  getCurrentUser(): GuestUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GuestUser;
    } catch {
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigateByUrl('/auth/login');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }
}

