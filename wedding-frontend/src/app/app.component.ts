import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CheckinService } from './services/checkin.service';

const PWA_INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  showInstallBanner = false;
  /** Instrucciones manuales: iOS/Safari o Android en HTTP (no hay beforeinstallprompt) */
  showManualInstallHint = false;
  private deferredPrompt: any = null;
  private installPromptHandler = (e: Event) => this.handleInstallPrompt(e);

  /** iOS/Safari: la instalación es siempre desde Compartir → Añadir a pantalla de inicio */
  isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);

  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly checkin = inject(CheckinService);

  private readonly pendingDoorCheckinKey = 'pending-door-checkin';
  private readonly pendingDoorCodeKey = 'pending-door-checkin-code';

  ngOnInit(): void {
    const forceInstallHint = this.shouldForceInstallHintFromUrl();

    // Si el invitado escaneó el QR de la puerta y luego vuelve a abrir desde el ícono,
    // a veces ya está logueado; en ese caso completamos el check-in automáticamente.
    try {
      const pending = localStorage.getItem(this.pendingDoorCheckinKey) === '1';
      const doorCode = localStorage.getItem(this.pendingDoorCodeKey) ?? '';

      if (pending && doorCode && this.auth.isAuthenticated()) {
        this.checkin.checkinFromQr(doorCode).subscribe({
          next: () => {
            localStorage.removeItem(this.pendingDoorCheckinKey);
            localStorage.removeItem(this.pendingDoorCodeKey);
            this.router.navigateByUrl('/dashboard/dashboard?justCheckedIn=1', { replaceUrl: true });
          },
          error: () => {
            // Si falla, no rompemos la app; dejamos el flag para reintentar cuando inicie sesión.
          },
        });
      }
    } catch {
      // Si localStorage no está disponible, ignoramos.
    }

    if (this.isStandalone()) return;
    if (!forceInstallHint && this.wasInstallDismissed()) return;
    window.addEventListener('beforeinstallprompt', this.installPromptHandler);
    // iOS: Safari nunca dispara beforeinstallprompt; mostramos instrucciones a los ~1,5 s
    // Android/HTTP: idem si no hay prompt nativo, a los 2 s
    const delay = this.isIos ? 1500 : 2000;
    setTimeout(() => this.maybeShowManualInstallHint(forceInstallHint), delay);
  }

  ngOnDestroy(): void {
    window.removeEventListener('beforeinstallprompt', this.installPromptHandler);
  }

  private handleInstallPrompt(e: Event): void {
    e.preventDefault();
    this.deferredPrompt = e;
    this.showInstallBanner = true;
  }

  private isStandalone(): boolean {
    return (
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    );
  }

  private wasInstallDismissed(): boolean {
    try {
      return localStorage.getItem(PWA_INSTALL_DISMISSED_KEY) === '1';
    } catch {
      return false;
    }
  }

  private maybeShowManualInstallHint(forceInstallHint = false): void {
    if (this.isStandalone() || this.showInstallBanner) return;
    // En iOS Safari mostramos siempre las instrucciones (aunque antes se haya descartado),
    // porque no existe prompt nativo y es la única forma de instalar.
    if (!this.isIos && !forceInstallHint && this.wasInstallDismissed()) return;

    if (forceInstallHint) {
      // Si el usuario ya descartó el banner antes, igual mostramos el hint por este flujo (QR de admin).
      try {
        localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
      } catch {}
    }

    // iOS: siempre mostramos instrucciones (Safari no tiene beforeinstallprompt)
    // Android: solo si no hay prompt nativo (p. ej. estamos en HTTP)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile && (this.isIos || !this.deferredPrompt)) {
      this.showManualInstallHint = true;
    }
  }

  private shouldForceInstallHintFromUrl(): boolean {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('install') === '1' || params.get('installHint') === '1';
    } catch {
      return false;
    }
  }

  async installPwa(): Promise<void> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.showInstallBanner = false;
      this.deferredPrompt = null;
      if (outcome === 'accepted') {
        try {
          localStorage.removeItem(PWA_INSTALL_DISMISSED_KEY);
        } catch {}
      }
      return;
    }
    this.showInstallBanner = false;
  }

  dismissInstallBanner(): void {
    this.showInstallBanner = false;
    this.showManualInstallHint = false;
    try {
      localStorage.setItem(PWA_INSTALL_DISMISSED_KEY, '1');
    } catch {}
  }
}
