import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: HttpResponse<any>;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();

  // TTL config in seconds
  private ttlConfig: { pattern: RegExp, ttl: number }[] = [
    { pattern: /^\/api\/categories/i, ttl: 300 },
    { pattern: /^\/api\/hero/i, ttl: 600 },
    { pattern: /^\/api\/products\/[a-zA-Z0-9-]+$/i, ttl: 180 }, // Detail
    { pattern: /^\/api\/products\?/i, ttl: 120 } // Listing
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept GET requests
    if (request.method !== 'GET') {
      return next.handle(request);
    }

    const urlWithParams = request.urlWithParams;

    // Check if we have a valid cached response
    const cachedItem = this.cache.get(urlWithParams);
    if (cachedItem && cachedItem.expiresAt > Date.now()) {
      return of(cachedItem.data);
    }

    // Determine TTL based on URL pattern
    const matchedConfig = this.ttlConfig.find(c => c.pattern.test(urlWithParams));
    const ttlSeconds = matchedConfig ? matchedConfig.ttl : 0;

    // Proceed with real request and conditionally cache it
    return next.handle(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse && ttlSeconds > 0) {
          try {
            this.cache.set(urlWithParams, {
              data: event,
              expiresAt: Date.now() + (ttlSeconds * 1000)
            });
          } catch (e) {
            // Failsafe (e.g. storage limit)
            console.warn('Interceptor Cache Write Failed', e);
          }
        }
      })
    );
  }

  /**
   * Cleans up keys matching a URL pattern (e.g., after an admin update)
   */
  public bust(urlPattern: string): void {
    const keysToRemove: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(urlPattern)) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.cache.delete(key));
  }
}
