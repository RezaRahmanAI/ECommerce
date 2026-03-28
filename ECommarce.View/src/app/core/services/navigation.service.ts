import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { Observable, shareReplay, map, catchError, of, startWith } from "rxjs";
import { isPlatformBrowser } from "@angular/common";
import { ApiHttpClient } from "../http/http-client";

export interface MegaMenuItem {
  id: number;
  name: string;
  slug: string;
  subCategories: MegaMenuSubCategory[];
  isOpen?: boolean;
}

export interface MegaMenuSubCategory {
  id: number;
  name: string;
  slug: string;
  collections: MegaMenuCollection[];
}

export interface MegaMenuCollection {
  id: number;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  private readonly api = inject(ApiHttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly baseUrl = "/navigation";
  private readonly CACHE_KEY = 'cache_mega_menu';

  private megaMenu$: Observable<MegaMenuItem[]>;

  constructor() {
    const cached = this.getFromCache();
    this.megaMenu$ = this.api.get<any>(`${this.baseUrl}/mega-menu`).pipe(
      map((response: any) => {
        const menu = response?.categories || response?.Categories || [];
        this.saveToCache(menu);
        return menu;
      }),
      catchError(() => {
        return of(cached || []);
      }),
      startWith(cached || []),
      shareReplay(1),
    );
  }

  getMegaMenu(): Observable<MegaMenuItem[]> {
    return this.megaMenu$;
  }

  refreshMenu(): void {
    this.removeCache();
  }

  private getFromCache(): MegaMenuItem[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private saveToCache(menu: MegaMenuItem[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(menu));
    } catch {}
  }

  private removeCache() {
    if (!isPlatformBrowser(this.platformId)) return;
    localStorage.removeItem(this.CACHE_KEY);
  }
}
