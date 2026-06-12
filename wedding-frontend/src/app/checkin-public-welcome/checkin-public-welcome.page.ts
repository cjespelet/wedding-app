import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { CheckinService } from '../services/checkin.service';

@Component({
  standalone: true,
  selector: 'app-checkin-public-welcome',
  templateUrl: './checkin-public-welcome.page.html',
  styleUrls: ['./checkin-public-welcome.page.scss'],
  imports: [CommonModule, IonicModule],
})
export class CheckinPublicWelcomePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkinService = inject(CheckinService);

  loading = true;
  error: string | null = null;
  alreadyCheckedIn = false;
  code: string | null = null;

  ngOnInit(): void {
    this.code = this.route.snapshot.queryParamMap.get('code');

    if (!this.code) {
      this.loading = false;
      this.error = 'Falta el código de ingreso en el QR.';
      return;
    }

    this.checkinService.checkinFromQrCode(this.code).subscribe({
      next: (res) => {
        this.alreadyCheckedIn = !!res.alreadyCheckedIn;
        this.loading = false;
      },
      error: (err) => {
        // eslint-disable-next-line no-console
        console.error('Public checkin error', err);
        this.error = 'No pudimos registrar tu ingreso.';
        this.loading = false;
      },
    });
  }

  goToLive(): void {
    // /display es público (no requiere login).
    this.router.navigateByUrl('/display');
  }

  retry(): void {
    if (!this.code) return;
    this.loading = true;
    this.error = null;
    this.checkinService.checkinFromQrCode(this.code).subscribe({
      next: (res) => {
        this.alreadyCheckedIn = !!res.alreadyCheckedIn;
        this.loading = false;
      },
      error: () => {
        this.error = 'No pudimos registrar tu ingreso. Probá nuevamente.';
        this.loading = false;
      },
    });
  }
}

