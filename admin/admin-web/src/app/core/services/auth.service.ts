import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  weddingId?: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'admin_jwt';
  private readonly userKey = 'admin_user';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, { email, password });
  }

  storeSession(res: LoginResponse) {
    localStorage.setItem(this.storageKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
  }

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.userKey);
    this.router.navigateByUrl('/login');
  }
}

