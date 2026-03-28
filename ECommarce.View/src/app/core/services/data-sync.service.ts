import { Injectable, inject, NgZone, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Observable, of, timer, Subject } from "rxjs";
import { switchMap, shareReplay, tap, catchError, startWith, takeUntil } from "rxjs";
import { CacheService, CacheEntry } from "./cache.service";
import { ApiHttpClient } from "../http/http-client";

export interface SyncConfig {
  endpoint: string;
  cacheKey: string;
  ttl: number;
  pollInterval?: number;
}

@Injectable({
  providedIn: "root",
})
export class DataSyncService {
  private readonly api = inject(ApiHttpClient);
  private readonly cache = inject(CacheService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  private syncJobs = new Map<string, Observable<any>>();
  private destroy$ = new Subject<void>();

  sync<T>(config: SyncConfig): Observable<T> {
    const { endpoint, cacheKey, ttl, pollInterval } = config;

    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      this.fetchAndCache<T>(endpoint, cacheKey, ttl);
    }

    const request$ = this.fetchAndCache<T>(endpoint, cacheKey, ttl).pipe(
      shareReplay(1),
    );

    if (pollInterval && pollInterval > 0) {
      this.startPolling(endpoint, cacheKey, ttl, pollInterval);
    }

    return request$;
  }

  syncWithFallback<T>(config: SyncConfig, fallback: T): Observable<T> {
    return this.sync<T>(config).pipe(
      catchError(() => of(fallback))
    );
  }

  private fetchAndCache<T>(endpoint: string, cacheKey: string, ttl: number): Observable<T> {
    return new Observable<T>(observer => {
      this.api.get<T>(endpoint).subscribe({
        next: (data) => {
          this.cache.set(cacheKey, data, ttl);
          const cached = this.cache.get<T>(cacheKey);
          if (cached) {
            observer.next(cached);
          } else {
            observer.next(data);
          }
          observer.complete();
        },
        error: (err) => {
          const cached = this.cache.get<T>(cacheKey);
          if (cached) {
            observer.next(cached);
            observer.complete();
          } else {
            observer.error(err);
          }
        }
      });
    });
  }

  private startPolling(endpoint: string, cacheKey: string, ttl: number, interval: number): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const jobKey = `${endpoint}_${cacheKey}`;
    if (this.syncJobs.has(jobKey)) return;

    const poll$ = timer(interval, interval).pipe(
      takeUntil(this.destroy$),
      switchMap(() => this.fetchAndCache(endpoint, cacheKey, ttl))
    );

    this.ngZone.runOutsideAngular(() => {
      poll$.subscribe();
    });

    this.syncJobs.set(jobKey, poll$);
  }

  invalidateCache(pattern: string): void {
    this.cache.invalidate(pattern);
  }

  clearAllCache(): void {
    this.cache.invalidateAll();
  }

  getFreshData<T>(endpoint: string, cacheKey: string, ttl: number): Observable<T> {
    this.cache.remove(cacheKey);
    return this.fetchAndCache<T>(endpoint, cacheKey, ttl);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
