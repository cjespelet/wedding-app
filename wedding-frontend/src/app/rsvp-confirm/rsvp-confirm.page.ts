import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { RsvpService } from '../services/rsvp.service';
import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-rsvp-confirm',
  templateUrl: './rsvp-confirm.page.html',
  styleUrls: ['./rsvp-confirm.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class RsvpConfirmPage implements OnInit {
  form = this.fb.group({
    adults: [1, [Validators.required, Validators.min(0)]],
    minors: [0, [Validators.required, Validators.min(0)]],
  });

  private maxAdults = 99;
  private maxMinors = 99;

  constructor(
    private fb: FormBuilder,
    private rsvpService: RsvpService,
    private auth: AuthService,
    private router: Router,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  ngOnInit(): void {
    this.rsvpService.getDefaults().subscribe({
      next: ({ adults, minors }) => {
        this.maxAdults = adults;
        this.maxMinors = minors;
        this.form.patchValue({ adults, minors });
        this.form
          .get('adults')
          ?.setValidators([Validators.required, Validators.min(0), Validators.max(adults)]);
        this.form
          .get('minors')
          ?.setValidators([Validators.required, Validators.min(0), Validators.max(minors)]);
        this.form.get('adults')?.updateValueAndValidity({ emitEvent: false });
        this.form.get('minors')?.updateValueAndValidity({ emitEvent: false });
      },
      error: () => {
        // Sin defaults: el invitado ingresa manualmente.
      },
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Confirmando asistencia...',
      spinner: 'crescent',
    });
    await loading.present();

    const { adults, minors } = this.form.getRawValue();

    this.rsvpService.confirmRsvp(adults ?? 0, minors ?? 0).subscribe({
      next: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Asistencia confirmada. ¡Gracias!',
          duration: 2500,
          color: 'success',
        });
        await toast.present();

        // Marcamos localmente para que el dashboard oculte el botón inmediatamente
        // (en iOS a veces el endpoint /rsvp/current tarda un poquito en reflejarse).
        try {
          const guestId = this.auth.getCurrentUser()?.id;
          localStorage.setItem('rsvp-confirmed-pending', '1');
          localStorage.setItem('rsvp-confirmed-pending-ts', String(Date.now()));
          localStorage.setItem('guest-rsvp-confirmed', '1'); // fallback when guestId is unavailable
          if (guestId) {
            localStorage.setItem(`guest-rsvp-confirmed:${guestId}`, '1');
          }
        } catch {}

        // Small delay helps avoid race where /rsvp/current still returns stale state.
        setTimeout(() => {
          const ts = Date.now();
          this.router.navigateByUrl(`/dashboard/dashboard?rsvpConfirmed=1&rsvpTs=${ts}`, {
            replaceUrl: true,
          });
        }, 700);
      },
      error: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'No se pudo confirmar. Intenta nuevamente.',
          duration: 2500,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }
}

