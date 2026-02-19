import { Injectable } from '@angular/core';

import { AuthSession } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly storageKey = 'auth_session';

  storeSession(session: AuthSession, rememberMe: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.storageKey, JSON.stringify(session));
  }

  updateSession(session: AuthSession): void {
    if (localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
      return;
    }
    if (sessionStorage.getItem(this.storageKey)) {
      sessionStorage.setItem(this.storageKey, JSON.stringify(session));
      return;
    }
    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  clearSession(): void {
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem(this.storageKey);
  }

  getSession(): AuthSession | null {
    const stored = localStorage.getItem(this.storageKey) ?? sessionStorage.getItem(this.storageKey);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as AuthSession;
    } catch {
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.getSession()?.token ?? null;
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }
}
