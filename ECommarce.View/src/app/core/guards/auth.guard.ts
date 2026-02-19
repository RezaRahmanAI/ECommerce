import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthStateService } from '../services/auth-state.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  return authState.isAuthenticated().pipe(
    map((isAuthed) => {
      if (isAuthed) {
        return true;
      }
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url },
      });
    }),
  );
};
