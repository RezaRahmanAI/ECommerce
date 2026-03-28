import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpContext,
} from "@angular/common/http";
import { isPlatformBrowser } from "@angular/common";

import { API_CONFIG, ApiConfig } from "../config/api.config";

@Injectable({
  providedIn: "root",
})
export class ApiHttpClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject<ApiConfig>(API_CONFIG);
  private readonly platformId = inject(PLATFORM_ID);

  private pendingRequests = new Map<string, any>();

  get<T>(
    path: string,
    options: {
      params?: any;
      headers?: HttpHeaders;
      context?: HttpContext;
    } = {},
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const cacheKey = `${path}${JSON.stringify(options.params || {})}`;
      if (this.pendingRequests.has(cacheKey)) {
        return this.pendingRequests.get(cacheKey);
      }
    }

    const request = this.http.get<T>(this.buildUrl(path), {
      ...options,
      withCredentials: true,
    });

    if (isPlatformBrowser(this.platformId)) {
      const cacheKey = `${path}${JSON.stringify(options.params || {})}`;
      this.pendingRequests.set(cacheKey, request);
      request.subscribe({
        complete: () => this.pendingRequests.delete(cacheKey),
        error: () => this.pendingRequests.delete(cacheKey),
      });
    }

    return request;
  }

  post<T>(
    path: string,
    body: unknown,
    options: { headers?: HttpHeaders; context?: HttpContext } = {},
  ) {
    return this.http.post<T>(this.buildUrl(path), body, {
      ...options,
      withCredentials: true,
    });
  }

  put<T>(
    path: string,
    body: unknown,
    options: { headers?: HttpHeaders; context?: HttpContext } = {},
  ) {
    return this.http.post<T>(this.buildUrl(path), body, {
      ...options,
      withCredentials: true,
    });
  }

  delete<T>(
    path: string,
    options: { headers?: HttpHeaders; context?: HttpContext } = {},
  ) {
    const deletePath = path.endsWith("/") ? `${path}delete` : `${path}/delete`;
    return this.http.post<T>(this.buildUrl(deletePath), null, {
      ...options,
      withCredentials: true,
    });
  }

  private buildUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = this.config.baseUrl.replace(/\/$/, "");
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${normalizedPath}`;
  }
}
