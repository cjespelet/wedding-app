import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

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
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  loading = false;
  backendError = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

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
      error: () => {
        this.loading = false;
        this.backendError = 'Credenciales inválidas. Verifica email y contraseña.';
        this.snackBar.open('Credenciales inválidas', 'Cerrar', { duration: 3000 });
      },
    });
  }
}

