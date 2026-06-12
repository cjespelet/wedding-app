import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';

/**
 * Route guard simple por rol para panel admin.
 * Uso: canActivate: [roleGuard], data: { roles: ['dj'] }
 */
export const roleGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const user = auth.getCurrentUser();

  const allowedRoles = (route.data?.['roles'] as string[] | undefined) ?? [];
  if (!user?.role) {
    router.navigateByUrl('/login');
    return false;
  }

  if (!allowedRoles.length || allowedRoles.includes(user.role)) {
    return true;
  }

  // Fallback por rol
  if (user.role === 'dj') {
    router.navigateByUrl('/dj-messages');
  } else {
    router.navigateByUrl('/dashboard');
  }
  return false;
};

