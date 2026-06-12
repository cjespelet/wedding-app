import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

export interface NotificationActor {
  id: string;
  username: string | null;
  fullName: string;
}

export interface AppNotification {
  id: string;
  type: string;
  label: string;
  photoId: string | null;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActor;
}

export interface NotificationsResponse {
  items: AppNotification[];
  page: number;
  hasMore: boolean;
  unreadCount: number;
}

/**
 * Servicio global: contador de no leídas y polling único (aunque haya varias campanitas en la UI).
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private static pollStarted = false;

  private readonly unreadCount = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this.unreadCount.asObservable();

  private pollSub?: Subscription;
  private resumeHandle?: { remove: () => Promise<void> };

  constructor(private http: HttpClient) {
    this.ensurePolling();
  }

  private ensurePolling(): void {
    if (NotificationService.pollStarted) {
      return;
    }
    NotificationService.pollStarted = true;

    this.pollSub = interval(20000)
      .pipe(
        startWith(0),
        switchMap(() => this.getUnreadCount()),
      )
      .subscribe({
        next: (r) => this.unreadCount.next(r.count),
        error: () => {
          /* offline */
        },
      });

    if (Capacitor.isNativePlatform()) {
      void App.addListener('resume', () => this.refreshUnread()).then((h) => {
        this.resumeHandle = h;
      });
    }
  }

  refreshUnread(): void {
    this.getUnreadCount().subscribe({
      next: (r) => this.unreadCount.next(r.count),
      error: () => {
        /* */
      },
    });
  }

  /** Sincronizar contador con respuesta de GET /notifications */
  setUnreadCount(count: number): void {
    this.unreadCount.next(count);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${environment.apiBaseUrl}/notifications/unread-count`);
  }

  getNotifications(page = 0, limit = 30): Observable<NotificationsResponse> {
    const params = new HttpParams().set('page', String(page)).set('limit', String(limit));
    return this.http.get<NotificationsResponse>(`${environment.apiBaseUrl}/notifications`, { params });
  }

  markRead(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiBaseUrl}/notifications/${encodeURIComponent(id)}/read`, {});
  }

  markAllRead(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${environment.apiBaseUrl}/notifications/read-all`, {});
  }
}
