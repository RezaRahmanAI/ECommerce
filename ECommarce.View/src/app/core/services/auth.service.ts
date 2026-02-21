import { Injectable, inject, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { Observable, catchError, map, tap, throwError, of } from "rxjs";

import { ApiHttpClient } from "../http/http-client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  token?: string;
}

interface AuthResponseDto {
  token: string;
  user: {
    id: string;
    name?: string;
    fullName?: string;
    email: string;
    role?: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly api = inject(ApiHttpClient);
  private readonly TOKEN_KEY = "auth_token";
  private readonly USER_KEY = "auth_user";
  private readonly SAVED_EMAIL_KEY = "saved_email";

  // Using a signal for reactive auth state
  readonly currentUser = signal<AuthUser | null>(null);

  constructor() {
    this.restoreSession();
    this.checkAuth().subscribe();
  }

  private restoreSession(): void {
    // Check localStorage first (Remember Me sessions)
    let token = localStorage.getItem(this.TOKEN_KEY);
    let userJson = localStorage.getItem(this.USER_KEY);

    // If not in localStorage, check sessionStorage (Non-Remember Me sessions)
    if (!token || !userJson) {
      token = sessionStorage.getItem(this.TOKEN_KEY);
      userJson = sessionStorage.getItem(this.USER_KEY);
    }

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as AuthUser;
        this.currentUser.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Observable<AuthSession> {
    return this.api
      .post<AuthResponseDto>("/auth/login", {
        email: email.trim(),
        password,
      })
      .pipe(
        map((response) => this.normalizeSession(response)),
        tap((session) => {
          if (session.token) {
            const storage = rememberMe ? localStorage : sessionStorage;

            storage.setItem(this.TOKEN_KEY, session.token);
            storage.setItem(this.USER_KEY, JSON.stringify(session.user));

            if (rememberMe) {
              localStorage.setItem(this.SAVED_EMAIL_KEY, session.user.email);
            } else {
              localStorage.removeItem(this.SAVED_EMAIL_KEY);
            }
          }
          this.currentUser.set(session.user);
        }),
        catchError((error) =>
          this.handleAuthError(error, "Invalid credentials"),
        ),
      );
  }

  checkAuth(): Observable<AuthSession | null> {
    const token = this.getToken();
    if (!token) {
      this.currentUser.set(null);
      return of(null);
    }

    return this.api.get<AuthUser>("/auth/me").pipe(
      map((user) => ({ user, token })),
      tap((session) => this.currentUser.set(session.user)),
      catchError(() => {
        this.logout(); // Invalid token or session expired
        return of(null);
      }),
    );
  }

  getToken(): string | null {
    return (
      localStorage.getItem(this.TOKEN_KEY) ||
      sessionStorage.getItem(this.TOKEN_KEY)
    );
  }

  getSavedEmail(): string | null {
    return localStorage.getItem(this.SAVED_EMAIL_KEY);
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  getRole(): string {
    return this.currentUser()?.role ?? "user";
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);

    // Optional: Call backend to clear cookies if any remain, but strictly we are stateless now
    this.api.post("/auth/logout", {}).subscribe({
      next: () => (window.location.href = "/login"),
      error: () => (window.location.href = "/login"),
    });
  }

  private normalizeSession(response: AuthResponseDto): AuthSession {
    const name =
      response.user.name ?? response.user.fullName ?? response.user.email;

    return {
      token: response.token,
      user: {
        id: response.user.id,
        name,
        email: response.user.email,
        role: response.user.role,
      },
    };
  }

  private handleAuthError(
    error: unknown,
    fallbackMessage: string,
  ): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const message = this.getErrorMessage(error) ?? fallbackMessage;
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error(fallbackMessage));
  }

  private getErrorMessage(error: HttpErrorResponse): string | null {
    const apiError = error.error;

    if (typeof apiError === "string") {
      return apiError;
    }

    if (apiError?.message) {
      return apiError.message as string;
    }

    if (apiError?.errors && typeof apiError.errors === "object") {
      const entries = Object.values(
        apiError.errors as Record<string, string[]>,
      ).flat();
      if (entries.length) {
        return entries.join(" ");
      }
    }

    return null;
  }
}
