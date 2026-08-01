import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController, IonicModule } from '@ionic/angular';
import { AuthService, GuestGroup } from '../services/auth.service';
import { CommonModule } from '@angular/common';

const INVITE_STORAGE_KEY = 'wedding_invite_id';

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
    username: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(15)]],
    password: ['', [Validators.required]],
    groupId: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.resolveInvite(params.get('invite'));
    });
  }

  private resolveInvite(inviteFromUrl: string | null): void {
    let inviteId = inviteFromUrl?.trim() || null;

    if (inviteId) {
      try {
        sessionStorage.setItem(INVITE_STORAGE_KEY, inviteId);
      } catch {
        /* ignore */
      }
    } else {
      try {
        inviteId = sessionStorage.getItem(INVITE_STORAGE_KEY);
      } catch {
        inviteId = null;
      }
    }

    this.hasInviteParam = !!inviteId;
    this.lockedGroupName = null;
    this.inviteError = null;
    this.form.controls.groupId.enable();

    if (!inviteId) {
      this.inviteLoading = false;
      this.auth.getGuestGroups().subscribe((groups) => {
        this.groups = groups;
      });
      return;
    }

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
  }

  private clearStoredInvite(): void {
    try {
      sessionStorage.removeItem(INVITE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
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
      username: v.username!.trim(),
      password: v.password!,
      groupId: v.groupId!,
    };

    this.auth.register(payload).subscribe({
      next: async () => {
        this.clearStoredInvite();
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
