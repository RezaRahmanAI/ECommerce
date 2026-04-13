import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { Observable, shareReplay, startWith, BehaviorSubject, switchMap, tap, of } from "rxjs";
import { ApiHttpClient } from "../http/http-client";

export interface SiteSettings {
  websiteName: string;
  description?: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  currency: string;
  freeShippingThreshold: number;
  shippingCharge: number;
  facebookPixelId?: string;
  googleTagId?: string;
  sizeGuideImageUrl?: string;
  
  // Cache Manifest Timestamps
  productsUpdatedAt?: string;
  categoriesUpdatedAt?: string;
  bannersUpdatedAt?: string;
  pagesUpdatedAt?: string;
}

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  private api = inject(ApiHttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private readonly SETTINGS_CACHE_KEY = "sherashop_settings_cache";
  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Initial default settings
  private readonly defaultSettings: SiteSettings = {
    websiteName: "SheraShopBD",
    currency: "BDT",
    freeShippingThreshold: 5000,
    shippingCharge: 0,
  };

  /**
   * Site Settings Stream:
   * 1. Starts with Cached data (localStorage) or Defaults for instant UI.
   * 2. Fetches fresh data from API in background and updates cache.
   */
  private settings$ = this.refreshSubject.pipe(
    switchMap(() => this.api.get<SiteSettings>("/sitesettings").pipe(
      tap(settings => this.saveToCache(settings)),
      startWith(this.loadFromCache())
    )),
    shareReplay(1)
  );

  getSettings(): Observable<SiteSettings> {
    return this.settings$;
  }

  refreshSettings(): void {
    this.refreshSubject.next();
  }

  private loadFromCache(): SiteSettings {
    if (isPlatformBrowser(this.platformId)) {
      const cached = localStorage.getItem(this.SETTINGS_CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error("Failed to parse settings cache", e);
        }
      }
    }
    return this.defaultSettings;
  }

  private saveToCache(settings: SiteSettings): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.SETTINGS_CACHE_KEY, JSON.stringify(settings));
    }
  }
}
