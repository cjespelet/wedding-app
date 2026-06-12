import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

export const loginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const token = localStorage.getItem('admin_jwt');
  const user = auth.getCurrentUser();

  if (token) {
    if (user?.role === 'dj') {
      router.navigateByUrl('/dj-messages');
    } else {
      router.navigateByUrl('/dashboard');
    }
    return false;
  }

  return true;
};

