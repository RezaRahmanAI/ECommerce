import { Injectable, inject, makeStateKey, TransferState, PLATFORM_ID } from "@angular/core";
import { isPlatformServer } from "@angular/common";
import { Observable, shareReplay, of, tap } from "rxjs";
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
  type: "Hero" | "Promo" | "Spotlight";
}

@Injectable({
  providedIn: "root",
})
export class BannerService {
  private readonly api = inject(ApiHttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly baseUrl = "/banners";
  private readonly BANNERS_KEY = makeStateKey<HeroBanner[]>("banners_data");

  getActiveBanners(): Observable<HeroBanner[]> {
    const isServer = isPlatformServer(this.platformId);
    
    if (this.transferState.hasKey(this.BANNERS_KEY)) {
      const data = this.transferState.get(this.BANNERS_KEY, [] as HeroBanner[]);
      return of(data);
    }

    return this.api.get<HeroBanner[]>(this.baseUrl).pipe(
      tap(data => {
        if (isServer) {
          this.transferState.set(this.BANNERS_KEY, data);
        }
      }),
      shareReplay(1)
    );
  }
}
