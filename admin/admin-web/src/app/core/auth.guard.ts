import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { clearStoredSession, isStoredSessionValid } from './auth-session';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (isStoredSessionValid()) {
    return true;
  }

  clearStoredSession();
  router.navigateByUrl('/login');
  return false;
};

