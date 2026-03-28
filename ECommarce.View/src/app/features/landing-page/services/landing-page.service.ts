import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, catchError, of } from "rxjs";
import { ApiHttpClient } from "../../../core/http/http-client";

export interface PublicLandingPage {
  id: number;
  productId: number;
  headline: string;
  videoUrl?: string;
  subtitle?: string;
  benefitsTitle?: string;
  benefitsContent?: string;
  reviewsTitle?: string;
  reviewsImages?: string;
  sideEffectsTitle?: string;
  sideEffectsContent?: string;
  usageTitle?: string;
  usageContent?: string;
  themeColor?: string;
}

@Injectable({ providedIn: "root" })
export class LandingPageService {
  private readonly api = inject(ApiHttpClient);
  
  // Cache landing pages by slug
  private cache = new Map<string, Observable<PublicLandingPage>>();

  getLandingPage(slug: string): Observable<PublicLandingPage> {
    if (!this.cache.has(slug)) {
      this.cache.set(slug, this.api.get<PublicLandingPage>(`/landingpage/public/${slug}`).pipe(
        shareReplay(1),
        catchError(() => of({} as PublicLandingPage))
      ));
    }
    return this.cache.get(slug)!;
  }
  
  clearCache(slug?: string): void {
    if (slug) {
      this.cache.delete(slug);
    } else {
      this.cache.clear();
    }
  }
}
