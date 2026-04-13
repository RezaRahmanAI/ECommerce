import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { HttpInterceptorFn, HttpResponse } from "@angular/common/http";
import { of, tap, take } from "rxjs";
import { SiteSettingsService } from "../core/services/site-settings.service";

interface CacheEntry {
  body: any;
  timestamp: number;
}

const CACHE_KEY_PREFIX = "sherashop_v2_cache_";
const DEFAULT_TTL = 3600_000; // 1 hour default if manifest fails

// Endpoints that should never be cached
const EXCLUDED_PATTERNS = [
  "/auth/",
  "/admin/",
  "/cart",
  "/orders",
  "/checkout",
  "/customers",
  "/analytics",
  "/sitesettings",
];

function shouldCache(url: string): boolean {
  if (!url.includes("/api/")) return false;
  return !EXCLUDED_PATTERNS.some((pattern) => url.includes(pattern));
}

function getCacheSection(url: string): string {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes("/products") || lowercaseUrl.includes("/home") || lowercaseUrl.includes("/items")) return "products";
  if (lowercaseUrl.includes("/categories") || lowercaseUrl.includes("/collections") || lowercaseUrl.includes("/navigation")) return "categories";
  if (lowercaseUrl.includes("/banners")) return "banners";
  if (lowercaseUrl.includes("/pages")) return "pages";
  return "general";
}

/**
 * Professional Persistent Cache Interceptor.
 * Serves data from LocalStorage and validates against a Server Manifest.
 */
export const httpCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const settingsService = inject(SiteSettingsService);

  // Only cache GET requests in the browser
  if (req.method !== "GET" || !isPlatformBrowser(platformId)) {
    return next(req);
  }

  // Skip non-API or excluded URLs
  if (!shouldCache(req.urlWithParams)) {
    return next(req);
  }

  const cacheKey = CACHE_KEY_PREFIX + btoa(req.urlWithParams);
  const cachedStr = localStorage.getItem(cacheKey);
  
  if (cachedStr) {
    try {
      const entry: CacheEntry = JSON.parse(cachedStr);
      let isFresh = false;

      // Validate against Settings Manifest
      // We use take(1) to avoid long subscriptions in interceptor
      let settings: any = null;
      settingsService.getSettings().pipe(take(1)).subscribe(s => settings = s);

      if (settings) {
        const section = getCacheSection(req.urlWithParams);
        let lastUpdateStr: string | undefined;

        switch (section) {
          case "products": lastUpdateStr = settings.productsUpdatedAt; break;
          case "categories": lastUpdateStr = settings.categoriesUpdatedAt; break;
          case "banners": lastUpdateStr = settings.bannersUpdatedAt; break;
          case "pages": lastUpdateStr = settings.pagesUpdatedAt; break;
        }

        if (lastUpdateStr) {
          const lastUpdate = new Date(lastUpdateStr).getTime();
          isFresh = entry.timestamp > lastUpdate;
        } else {
          // Fallback to TTL if section not in manifest
          isFresh = Date.now() - entry.timestamp < DEFAULT_TTL;
        }
      }

      if (isFresh) {
        return of(new HttpResponse({ body: entry.body, status: 200, url: req.urlWithParams }));
      }
    } catch (e) {
      localStorage.removeItem(cacheKey);
    }
  }

  // Otherwise, make the network request and store in persistent cache
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status === 200) {
        const newEntry: CacheEntry = {
          body: event.body,
          timestamp: Date.now()
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(newEntry));
        } catch (e) {
          // LocalStorage might be full
          if (e instanceof DOMException && e.name === "QuotaExceededError") {
             clearHttpCache(); // Clear old cache to make room
          }
        }
      }
    }),
  );
};

export function clearHttpCache(): void {
  if (typeof localStorage !== "undefined") {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEY_PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }
}

export function invalidateHttpCache(pattern: string): void {
  if (typeof localStorage !== "undefined") {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEY_PREFIX))
      .forEach(key => {
        // This is a bit slow as we have to decode keys to check pattern
        try {
          const originalUrl = atob(key.replace(CACHE_KEY_PREFIX, ""));
          if (originalUrl.includes(pattern)) {
            localStorage.removeItem(key);
          }
        } catch {}
      });
  }
}
