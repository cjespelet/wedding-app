import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { clearStoredSession } from '../../core/auth-session';

@Component({
  standalone: true,
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  backendError = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    clearStoredSession();
  }

  submit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.backendError = '';
    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login(email, password).subscribe({
      next: (res) => {
        this.auth.storeSession(res);
        this.loading = false;
        this.router.navigateByUrl('/dashboard');
      },
      error: (err) => {
        this.loading = false;
        const apiError = err?.error?.error;
        const status = err?.status;
        this.backendError =
          apiError === 'Invalid credentials'
            ? 'Credenciales inválidas. En producción usá el email del admin de la boda (no el usuario local).'
            : status === 0
              ? 'No se pudo conectar con la API. Revisá tu conexión.'
              : 'No se pudo iniciar sesión. Probá de nuevo.';
        this.cdr.detectChanges();
        this.snackBar.open(this.backendError, 'Cerrar', { duration: 4000 });
      },
    });
  }
}

