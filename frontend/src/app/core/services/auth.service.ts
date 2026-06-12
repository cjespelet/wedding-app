import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

// Adjust this import to your actual environment path
import { environment } from '../../../environments/environment';

export type UserRole = 'super_admin' | 'wedding_admin' | 'guest' | 'dj' | 'photographer';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  role: UserRole;
  weddingId?: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface InvitationLoginResponse {
  token: string;
  guest: {
    id: string;
    name: string;
    weddingId: string;
  };
  wedding: {
    id: string;
    brideName: string;
    groomName: string;
    date: string;
    location: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly storageKey = 'wedding_app_jwt';

  readonly token = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<AuthUser | null>(null);

  private get apiUrl() {
    return `${environment.apiBaseUrl}/auth`;
  }

  private getStoredToken(): string | null {
    if (typeof localStorage === 'undefined') {
      return null;
    }
    return localStorage.getItem(this.storageKey);
  }

  private storeToken(token: string) {
    this.token.set(token);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, token);
    }
  }

  private clearToken() {
    this.token.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }

  loginAdmin(email: string, password: string) {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).subscribe({
      next: (res) => {
        this.storeToken(res.token);
        this.currentUser.set(res.user);
        this.router.navigateByUrl('/admin/dashboard');
      },
    });
  }

  loginWithInvitation(code: string, name: string) {
    return this.http.post<InvitationLoginResponse>(`${this.apiUrl}/invitation`, { code, name }).subscribe({
      next: (res) => {
        this.storeToken(res.token);
        this.currentUser.set({
          id: res.guest.id,
          name: res.guest.name,
          role: 'guest',
          weddingId: res.guest.weddingId,
        });
        this.router.navigateByUrl('/guest/home');
      },
    });
  }

  logout() {
    this.clearToken();
    this.currentUser.set(null);
    this.router.navigateByUrl('/auth/login');
  }
}

