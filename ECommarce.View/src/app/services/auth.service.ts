import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject, tap } from "rxjs";
import { environment } from "../../environments/environment";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load user from localStorage on service init
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  get currentUserValue(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!this.getToken();
  }

  get isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.roles.includes("Admin") || false;
  }

  getToken(): string | null {
    return localStorage.getItem("token");
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, data)
      .pipe(tap((response) => this.setSession(response)));
  }

  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    this.currentUserSubject.next(null);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem("token", authResult.token);
    localStorage.setItem("currentUser", JSON.stringify(authResult));
    this.currentUserSubject.next(authResult);
  }
}
