import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { API_CONFIG, ApiConfig } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class ApiHttpClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);

  get<T>(path: string, options?: { params?: HttpParams; headers?: HttpHeaders }) {
    return this.http.get<T>(this.buildUrl(path), options);
  }

  post<T>(path: string, body: unknown, options?: { headers?: HttpHeaders }) {
    return this.http.post<T>(this.buildUrl(path), body, options);
  }

  put<T>(path: string, body: unknown, options?: { headers?: HttpHeaders }) {
    return this.http.put<T>(this.buildUrl(path), body, options);
  }

  delete<T>(path: string, options?: { headers?: HttpHeaders }) {
    return this.http.delete<T>(this.buildUrl(path), options);
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }
}
