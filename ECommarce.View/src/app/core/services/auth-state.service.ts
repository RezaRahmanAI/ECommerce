import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { AuthService, AuthSession } from './auth.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthStateService {
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);

  private readonly sessionSubject = new BehaviorSubject<AuthSession | null>(this.authService.getSession());
  readonly session$ = this.sessionSubject.asObservable();

  readonly user$ = this.session$.pipe(map((session) => session?.user ?? null));

  constructor() {
    const session = this.sessionSubject.getValue();
    if (session) {
      this.userService.ensureUserProfile(session.user);
    }
  }

  login(email: string, password: string, rememberMe: boolean): Observable<AuthSession> {
    return this.authService.login(email, password).pipe(
      tap((session) => {
        this.authService.storeSession(session, rememberMe);
        this.sessionSubject.next(session);
        this.userService.ensureUserProfile(session.user);
      }),
    );
  }

  logout(): void {
    this.authService.logout();
    this.sessionSubject.next(null);
  }

  updateUser(partial: Partial<AuthSession['user']>): void {
    const session = this.sessionSubject.getValue();
    if (!session) {
      return;
    }
    const updated: AuthSession = {
      ...session,
      user: { ...session.user, ...partial },
    };
    this.sessionSubject.next(updated);
    this.authService.updateSession(updated);
  }

  refreshFromStorage(): void {
    this.sessionSubject.next(this.authService.getSession());
  }

  isAuthenticated(): Observable<boolean> {
    return this.session$.pipe(map((session) => session !== null));
  }

  getSessionSnapshot(): AuthSession | null {
    return this.sessionSubject.getValue();
  }

  getUserSnapshot(): AuthSession['user'] | null {
    return this.sessionSubject.getValue()?.user ?? null;
  }
}
