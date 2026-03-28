import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { Observable, of, shareReplay, catchError, tap, startWith } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import { ApiHttpClient } from "../http/http-client";

export interface SiteSettings {
  websiteName: string;
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
  whatsAppNumber?: string;
  freeShippingThreshold: number;
  facebookPixelId?: string;
  googleTagId?: string;
}

@Injectable({
  providedIn: "root",
})
export class SiteSettingsService {
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly CACHE_KEY = 'cache_site_settings';

  private settings$: Observable<SiteSettings>;

  constructor() {
    const cached = this.getFromCache();
    this.settings$ = this.api.get<SiteSettings>("/sitesettings").pipe(
      tap((settings: SiteSettings) => {
        this.saveToCache(settings);
      }),
      startWith(cached || this.getDefaultSettings()),
      shareReplay(1),
      catchError(() => of(cached || this.getDefaultSettings()))
    );
  }

  getSettings(): Observable<SiteSettings> {
    return this.settings$;
  }

  refreshSettings(): void {
    this.removeCache();
  }

  private getFromCache(): SiteSettings | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private saveToCache(settings: SiteSettings) {
    if (!isPlatformBrowser(this.platformId) || !settings) return;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(settings));
    } catch {}
  }

  private removeCache() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.CACHE_KEY);
  }

  private getDefaultSettings(): SiteSettings {
    return {
      websiteName: "SheraShopBD24",
      freeShippingThreshold: 0
    };
  }
}
