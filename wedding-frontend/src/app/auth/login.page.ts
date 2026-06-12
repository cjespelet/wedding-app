import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { CheckinService } from '../services/checkin.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class LoginPage implements OnInit {
  form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly checkin = inject(CheckinService);

  private readonly pendingDoorCheckinKey = 'pending-door-checkin';
  private readonly pendingDoorCodeKey = 'pending-door-checkin-code';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    // Door QR -> /auth/login?doorCheckin=1&doorCode=XXXX
    const doorCheckin = this.activatedRoute.snapshot.queryParamMap.get('doorCheckin');
    const doorCode = this.activatedRoute.snapshot.queryParamMap.get('doorCode');

    if (doorCheckin === '1' && doorCode) {
      localStorage.setItem(this.pendingDoorCheckinKey, '1');
      localStorage.setItem(this.pendingDoorCodeKey, doorCode);
    }
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Ingresando...',
      spinner: 'crescent',
    });
    await loading.present();

    const { username, password } = this.form.getRawValue();

    this.auth.login(username!, password!).subscribe({
      next: async () => {
        await loading.dismiss();
        const pending = localStorage.getItem(this.pendingDoorCheckinKey) === '1';
        const doorCode = localStorage.getItem(this.pendingDoorCodeKey) ?? '';

        if (!pending) {
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          return;
        }

        if (!doorCode) {
          localStorage.removeItem(this.pendingDoorCheckinKey);
          localStorage.removeItem(this.pendingDoorCodeKey);
          this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          return;
        }

        // Con el login hecho, marcamos como presente y vamos a Bienvenido.
        this.checkin.checkinFromQr(doorCode).subscribe({
          next: async () => {
            localStorage.removeItem(this.pendingDoorCheckinKey);
            localStorage.removeItem(this.pendingDoorCodeKey);
            this.router.navigateByUrl('/dashboard/dashboard?justCheckedIn=1', { replaceUrl: true });
          },
          error: async () => {
            localStorage.removeItem(this.pendingDoorCheckinKey);
            localStorage.removeItem(this.pendingDoorCodeKey);
            this.router.navigateByUrl('/dashboard', { replaceUrl: true });
          },
        });
      },
      error: async (err) => {
        // eslint-disable-next-line no-console
        console.error('Login error', err);
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Usuario o contraseña incorrectos',
          duration: 2500,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  goToRegister() {
    this.router.navigateByUrl('/auth/register');
  }
}

