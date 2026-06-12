import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AuthService, GuestUser } from '../services/auth.service';
import { WeddingService, WeddingInfo } from '../services/wedding.service';
import { RsvpService } from '../services/rsvp.service';
import { CheckinService } from '../services/checkin.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit, OnDestroy {
  user: GuestUser | null;
  wedding: WeddingInfo | null = null;
  hasRsvp = false;
  isCheckedIn = false;
  justCheckedIn = false;

  private readonly rsvpConfirmedPendingKey = 'rsvp-confirmed-pending';
  private readonly rsvpConfirmedPendingTsKey = 'rsvp-confirmed-pending-ts';
  private queryParamsSub?: { unsubscribe: () => void };

  constructor(
    private auth: AuthService,
    private weddingService: WeddingService,
    private rsvpService: RsvpService,
    private router: Router,
    private checkinService: CheckinService,
    private route: ActivatedRoute,
  ) {
    this.user = this.auth.getCurrentUser();
  }

  ngOnInit(): void {
    // React to query param changes (Ionic keeps pages cached).
    this.queryParamsSub = this.route.queryParamMap.subscribe(() => {
      this.refreshState();
    });
    this.refreshState();
  }

  ngOnDestroy(): void {
    this.queryParamsSub?.unsubscribe();
  }

  /**
   * Ionic hook: cuando volvés a entrar al dashboard desde otra pantalla
   * (por ejemplo confirmación de RSVP), actualizamos el estado.
   */
  ionViewWillEnter(): void {
    this.refreshState();
  }

  private refreshState(): void {
    this.user = this.auth.getCurrentUser();
    this.justCheckedIn = this.route.snapshot.queryParamMap.get('justCheckedIn') === '1';
    const queryRsvpConfirmed = this.route.snapshot.queryParamMap.get('rsvpConfirmed') === '1';

    // Fuente inicial robusta para no mostrar el botón al volver de confirmar.
    let persistedConfirmed = false;
    try {
      const guestId = this.user?.id;
      persistedConfirmed = guestId
        ? localStorage.getItem(`guest-rsvp-confirmed:${guestId}`) === '1'
        : localStorage.getItem('guest-rsvp-confirmed') === '1';
      this.hasRsvp = persistedConfirmed;
    } catch {
      this.hasRsvp = false;
    }

    let rsvpConfirmed = false;
    try {
      const pending = localStorage.getItem(this.rsvpConfirmedPendingKey) === '1';
      const ts = Number(localStorage.getItem(this.rsvpConfirmedPendingTsKey) ?? '0');
      const withinWindow = ts > 0 && Date.now() - ts < 60_000;
      rsvpConfirmed = (pending && withinWindow) || queryRsvpConfirmed;
    } catch {}

    this.weddingService.getCurrentWedding().subscribe({
      next: (w) => (this.wedding = w),
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error('Error cargando información de la boda', err);
      },
    });

    // Si venimos de confirmar RSVP, ocultamos el botón inmediatamente para UX fluida.
    // También respetamos estado persistido para evitar flicker al primer retorno.
    this.hasRsvp = persistedConfirmed || rsvpConfirmed;

    // Intentamos refrescar por endpoint para consistencia.
    this.rsvpService.getCurrentRsvp().subscribe({
      next: (rsvp) => {
        this.hasRsvp = !!rsvp?.attending;
        try {
          const guestId = this.user?.id;
          if (guestId) {
            localStorage.setItem(`guest-rsvp-confirmed:${guestId}`, this.hasRsvp ? '1' : '0');
          }
          localStorage.setItem('guest-rsvp-confirmed', this.hasRsvp ? '1' : '0');
        } catch {}
        // Recién cuando backend confirma attending, limpiamos el flag local.
        if (this.hasRsvp) {
          try {
            localStorage.removeItem(this.rsvpConfirmedPendingKey);
            localStorage.removeItem(this.rsvpConfirmedPendingTsKey);
          } catch {}
        }
      },
      error: () => {
        // Race condition: si el endpoint aún no refleja la confirmación,
        // NO re-mostramos el botón si ya estábamos confirmados.
        if (!rsvpConfirmed) {
          // Conservamos el estado persistido localmente.
          try {
            const guestId = this.user?.id;
            this.hasRsvp = guestId
              ? localStorage.getItem(`guest-rsvp-confirmed:${guestId}`) === '1'
              : localStorage.getItem('guest-rsvp-confirmed') === '1';
          } catch {
            this.hasRsvp = false;
          }
        }
      },
    });

    // Reintento corto cuando asumimos confirmación (iOS/Safari).
    if (rsvpConfirmed) {
      setTimeout(() => {
        this.rsvpService.getCurrentRsvp().subscribe({
          next: (rsvp) => (this.hasRsvp = !!rsvp?.attending),
          error: () => {
            // mantenemos el valor actual
          },
        });
      }, 1500);
    }

    this.checkinService.getStatus().subscribe({
      next: (status) => {
        this.isCheckedIn = status.checkedIn;
      },
      error: () => {
        this.isCheckedIn = false;
      },
    });
  }

  goToRsvpConfirm(): void {
    this.router.navigateByUrl('/rsvp/confirm');
  }

  async startCheckin(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.startCheckinNative();
    } else {
      this.router.navigateByUrl('/dashboard/dashboard/scan-qr');
    }
  }

  private async startCheckinNative(): Promise<void> {
    const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
    const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
    const code = barcodes?.[0]?.rawValue ?? barcodes?.[0]?.displayValue ?? '';
    if (!code?.trim()) {
      return;
    }
    this.checkinService.checkinFromQr(code.trim()).subscribe({
      next: (res) => {
        if (res.alreadyCheckedIn) {
          alert('Tu ingreso ya estaba registrado. ¡Disfrutá de la fiesta!');
        } else {
          alert('Ingreso registrado. ¡Bienvenido a la fiesta!');
        }
            this.router.navigateByUrl('/dashboard/dashboard?justCheckedIn=1', { replaceUrl: true });
      },
      error: () => {
        alert('No pudimos registrar tu ingreso. Intentalo de nuevo o consultá en recepción.');
      },
    });
  }
}
