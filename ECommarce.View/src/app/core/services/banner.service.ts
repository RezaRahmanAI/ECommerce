import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { Observable, of, catchError } from "rxjs";
import { tap, startWith } from "rxjs/operators";
import { isPlatformBrowser } from "@angular/common";
import { ApiHttpClient } from "../http/http-client";

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  buttonText: string;
  displayOrder: number;
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = "/banners";
  private readonly CACHE_KEY = 'cache_banners';

  getActiveBanners(): Observable<HeroBanner[]> {
    return this.api.get<HeroBanner[]>(this.baseUrl).pipe(
      tap((banners: HeroBanner[]) => {
        this.saveToCache(banners);
      }),
      startWith(this.getFromCache() || []),
      catchError(() => of(this.getFromCache() || []))
    );
  }

  refreshBanners(): void {
    this.removeCache();
  }

  private getFromCache(): HeroBanner[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private saveToCache(banners: HeroBanner[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(banners));
    } catch {}
  }

  private removeCache() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.CACHE_KEY);
  }
}
