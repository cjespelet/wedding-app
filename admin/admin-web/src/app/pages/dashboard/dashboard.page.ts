import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { WeddingService } from '../../core/services/wedding.service';
import { GuestsService, Guest, confirmedCounts } from '../../core/services/guests.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LocalDatePipe } from '../../shared/pipes/local-date.pipe';
import { Subscription } from 'rxjs';

interface AdminAnalytics {
  confirmedGuests: number;
  totalGuests: number;
  songRequests: number;
  photos: number;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [CommonModule, MatCardModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule, RouterModule, LocalDatePipe],
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly weddingService = inject(WeddingService);
  private readonly guestsService = inject(GuestsService);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  wedding$ = this.weddingService.getWedding();
  analytics?: AdminAnalytics;
  guests: Guest[] = [];
  loadingGuests = true;
  loadError = '';

  private guestsSub?: Subscription;
  private analyticsSub?: Subscription;

  /** URL de la app PWA para invitados (QR para abrir la app en el celular) */
  pwaAppUrl = environment.guestAppUrl;
  /** QR para instalar: fuerza el hint de "Añadir a pantalla de inicio" */
  pwaAppInstallHintUrl = `${this.pwaAppUrl}?install=1`;
  /** Código del QR de ingreso a la fiesta (lo escanea el invitado en la puerta) */
  checkinQrCode = 'jESIjAVI2026';

  /** QR general de la puerta:
   *  abre el login del invitado y al loguearse automáticamente hace check-in.
   */
  checkinDoorLoginUrl = `${this.pwaAppUrl}/auth/login?doorCheckin=1&doorCode=${encodeURIComponent(this.checkinQrCode)}`;

  qrRefreshTick = 0;
  private qrInterval: ReturnType<typeof setInterval> | null = null;

  encodeUri(value: string): string {
    return encodeURIComponent(value);
  }

  ngOnInit(): void {
    this.load();
    this.startQrRefresh();
  }

  ngOnDestroy(): void {
    this.guestsSub?.unsubscribe();
    this.analyticsSub?.unsubscribe();
    if (this.qrInterval) {
      clearInterval(this.qrInterval);
      this.qrInterval = null;
    }
  }

  load() {
    this.loadingGuests = true;
    this.loadError = '';
    this.guestsSub?.unsubscribe();
    this.analyticsSub?.unsubscribe();

    this.guestsSub = this.guestsService.list().subscribe({
      next: (guests) => {
        this.guests = Array.isArray(guests) ? guests : [];
        this.loadingGuests = false;
        this.loadError = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guests = [];
        this.loadingGuests = false;
        this.loadError =
          err?.error?.error ||
          'No se pudieron cargar los invitados. El servidor puede estar iniciando; probá de nuevo.';
        this.cdr.detectChanges();
        this.snackBar.open(this.loadError, 'Reintentar', { duration: 6000 }).onAction().subscribe(() => this.load());
      },
    });

    this.analyticsSub = this.http
      .get<AdminAnalytics>(`${environment.apiBaseUrl}/admin/analytics`)
      .subscribe({
        next: (data) => {
          this.analytics = data;
          this.cdr.detectChanges();
        },
        error: () => {
          // Analytics es secundario; no bloqueamos el dashboard si falla.
        },
      });
  }

  private startQrRefresh() {
    // iOS/Safari a veces cachea imágenes externas de QRServer; forzamos refresh.
    this.qrInterval = setInterval(() => {
      this.qrRefreshTick++;
      this.cdr.detectChanges();
    }, 60_000);
  }

  get presentCount(): number {
    return this.guests.filter((g) => g.checkedIn).length;
  }

  // Invitados (por configuración)
  get invitedAdults(): number {
    return this.guests.reduce((sum, g) => sum + (g.adultsCount ?? 0), 0);
  }

  get invitedMinors(): number {
    return this.guests.reduce((sum, g) => sum + (g.minorsCount ?? 0), 0);
  }

  // Confirmados (según último RSVP)
  get confirmedAdults(): number {
    return this.guests.reduce((sum, g) => {
      const c = confirmedCounts(g);
      return c ? sum + c.adults : sum;
    }, 0);
  }

  get confirmedMinors(): number {
    return this.guests.reduce((sum, g) => {
      const c = confirmedCounts(g);
      return c ? sum + c.minors : sum;
    }, 0);
  }

  // Presentes (según check-in)
  get presentAdults(): number {
    return this.guests
      .filter((g) => g.checkedIn)
      .reduce((sum, g) => sum + (g.adultsCount ?? 0), 0);
  }

  get presentMinors(): number {
    return this.guests
      .filter((g) => g.checkedIn)
      .reduce((sum, g) => sum + (g.minorsCount ?? 0), 0);
  }

  // Totales para la segunda fila
  get totalInvited(): number {
    return this.invitedAdults + this.invitedMinors;
  }

  get totalConfirmed(): number {
    return this.confirmedAdults + this.confirmedMinors;
  }

  get totalPresent(): number {
    return this.presentAdults + this.presentMinors;
  }
}
