import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastCtrl = inject(ToastController);
  private readonly loadingCtrl = inject(LoadingController);

  groups: GuestGroup[] = [];
  /** Invitación personalizada: grupo fijado desde la URL */
  lockedGroupName: string | null = null;
  inviteError: string | null = null;
  inviteLoading = false;
  hasInviteParam = false;

  form = this.fb.group({
    name: ['', [Validators.required]],
    username: [''],
    password: ['', [Validators.required]],
    groupId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const inviteId = this.route.snapshot.queryParamMap.get('invite');
    this.hasInviteParam = !!inviteId;

    if (inviteId) {
      this.inviteLoading = true;
      this.auth.getInvitePreview(inviteId).subscribe({
        next: (invite) => {
          this.inviteLoading = false;
          this.lockedGroupName = invite.displayName;
          this.form.patchValue({ groupId: invite.id });
          this.form.controls.groupId.disable();
        },
        error: (err) => {
          this.inviteLoading = false;
          if (err?.status === 409) {
            this.inviteError = 'Esta invitación ya fue usada. Ingresá con tu usuario y contraseña.';
          } else {
            this.inviteError = 'El link de invitación no es válido.';
          }
        },
      });
      return;
    }

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
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: async (err) => {
        await loading.dismiss();
        const message =
          err?.status === 409
            ? 'Este invitado ya tiene cuenta. Probá ingresar.'
            : 'No se pudo crear la cuenta. Intenta nuevamente.';
        const toast = await this.toastCtrl.create({
          message,
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
