import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './services/auth.service';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();

  if (!token) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(cloned);
};

