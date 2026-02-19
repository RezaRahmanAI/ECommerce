import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';

import { ApiHttpClient } from '../http/http-client';
import { AuthSessionService } from './auth-session.service';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthSession {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  user: AuthUser;
}

interface AuthResponseDto {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  expiresAt?: string;
  user: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    role?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiHttpClient);
  private readonly sessionStorage = inject(AuthSessionService);

  login(email: string, password: string): Observable<AuthSession> {
    return this.api
      .post<AuthResponseDto>('/auth/login', {
        email: email.trim(),
        password,
      })
      .pipe(
        map((response) => this.normalizeSession(response)),
        catchError((error) => this.handleAuthError(error, 'Invalid credentials')),
      );
  }

  storeSession(session: AuthSession, rememberMe: boolean): void {
    this.sessionStorage.storeSession(session, rememberMe);
  }

  updateSession(session: AuthSession): void {
    this.sessionStorage.updateSession(session);
  }

  clearSession(): void {
    this.sessionStorage.clearSession();
  }

  getSession(): AuthSession | null {
    return this.sessionStorage.getSession();
  }

  isAuthenticated(): boolean {
    return this.sessionStorage.isAuthenticated();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getRole(): string {
    return this.getSession()?.user.role ?? 'user';
  }

  logout(): void {
    this.clearSession();
  }

  private normalizeSession(response: AuthResponseDto): AuthSession {
    const token = response.accessToken ?? response.token;
    if (!token) {
      throw new Error('Authentication token not provided');
    }

    const name = response.user.name ?? response.user.fullName ?? response.user.email;

    return {
      token,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
      user: {
        id: response.user.id,
        name,
        email: response.user.email,
        role: response.user.role,
      },
    };
  }

  private handleAuthError(error: unknown, fallbackMessage: string): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message = this.getErrorMessage(error) ?? fallbackMessage;
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private getErrorMessage(error: HttpErrorResponse): string | null {
    const apiError = error.error;

    if (typeof apiError === 'string') {
      return apiError;
    }

    if (apiError?.message) {
      return apiError.message as string;
    }

    if (apiError?.errors && typeof apiError.errors === 'object') {
      const entries = Object.values(apiError.errors as Record<string, string[]>).flat();
      if (entries.length) {
        return entries.join(' ');
      }
    }

    return null;
  }
}
