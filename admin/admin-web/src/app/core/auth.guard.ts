import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem('admin_jwt');

  if (token) {
    return true;
  }

  router.navigateByUrl('/login');
  return false;
};

