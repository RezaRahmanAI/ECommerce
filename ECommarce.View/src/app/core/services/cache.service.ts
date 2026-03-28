import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { BehaviorSubject, Observable } from "rxjs";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheConfig {
  ttl: number;
  storageKey: string;
}

@Injectable({
  providedIn: "root",
})
export class CacheService {
  private readonly platformId = inject(PLATFORM_ID);
  private memoryCache = new Map<string, CacheEntry<any>>();
  private invalidation$ = new BehaviorSubject<Set<string>>(new Set());

  private readonly DEFAULT_TTL = 5 * 60 * 1000;

  get<T>(key: string, options?: { ttl?: number; bypassCache?: boolean }): T | null {
    if (options?.bypassCache) {
      this.remove(key);
      return null;
    }

    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data as T;
    }

    if (isPlatformBrowser(this.platformId)) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const entry: CacheEntry<T> = JSON.parse(stored);
          if (!this.isExpired(entry)) {
            this.memoryCache.set(key, entry);
            return entry.data;
          }
        }
      } catch {}
    }

    return null;
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.memoryCache.set(key, entry);

    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(key, JSON.stringify(entry));
      } catch {}
    }
  }

  remove(key: string): void {
    this.memoryCache.delete(key);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(key);
    }
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.memoryCache.keys()).filter(k => k.includes(pattern));
    keys.forEach(k => this.remove(k));
    
    const current = this.invalidation$.value;
    current.add(pattern);
    this.invalidation$.next(current);
  }

  invalidateAll(): void {
    this.memoryCache.clear();
    if (isPlatformBrowser(this.platformId)) {
      Object.keys(localStorage)
        .filter(k => k.startsWith('cache_'))
        .forEach(k => localStorage.removeItem(k));
    }
    this.invalidation$.next(new Set());
  }

  getInvalidationEvents(): Observable<Set<string>> {
    return this.invalidation$.asObservable();
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  isFresh(key: string, maxAge: number = this.DEFAULT_TTL): boolean {
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      return Date.now() - memEntry.timestamp < maxAge;
    }
    return false;
  }
}
