import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { AuthService, GuestGroup } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
})
export class RegisterPage implements OnInit {
  groups: GuestGroup[] = [];

  form = this.fb.group({
    name: ['', [Validators.required]],
    username: [''],
    password: ['', [Validators.required]],
    groupId: ['', [Validators.required]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit(): void {
    this.auth.getGuestGroups().subscribe((groups) => {
      this.groups = groups;
    });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando cuenta...',
      spinner: 'crescent',
    });
    await loading.present();

    const v = this.form.getRawValue();
    const payload = {
      name: v.name!,
      password: v.password!,
      groupId: v.groupId!,
      ...(v.username?.trim() ? { username: v.username.trim() } : {}),
    };

    this.auth.register(payload).subscribe({
      next: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'Cuenta creada con éxito',
          duration: 2500,
          color: 'success',
        });
        await toast.present();
        // Auto login ya ocurrió en el servicio; vamos directo al dashboard
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: async () => {
        await loading.dismiss();
        const toast = await this.toastCtrl.create({
          message: 'No se pudo crear la cuenta. Intenta nuevamente.',
          duration: 2500,
          color: 'danger',
        });
        await toast.present();
      },
    });
  }

  goToLogin() {
    this.router.navigateByUrl('/auth/login');
  }
}

