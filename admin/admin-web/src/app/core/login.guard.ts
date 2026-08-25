import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { clearStoredSession, isStoredSessionValid } from './auth-session';

export const loginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (!isStoredSessionValid()) {
    clearStoredSession();
    return true;
  }

  const user = auth.getCurrentUser();
  if (user?.role === 'dj') {
    router.navigateByUrl('/dj-messages');
  } else {
    router.navigateByUrl('/dashboard');
  }
  return false;
};

