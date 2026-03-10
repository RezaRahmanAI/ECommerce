import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
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

  getLandingPage(slug: string): Observable<PublicLandingPage> {
    return this.api.get<PublicLandingPage>(`/landingpage/public/${slug}`);
  }
}
