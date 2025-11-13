import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export function canActivateRole(allowed: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      router.navigateByUrl('/');
      return false;
    }
    if (allowed.length && !allowed.includes(auth.userRole())) {
      router.navigateByUrl('/');
      return false;
    }
    return true;
  };
}


