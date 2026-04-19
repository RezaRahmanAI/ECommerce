import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay, BehaviorSubject, switchMap } from "rxjs";
import { catchError, map, tap, startWith } from "rxjs/operators";
import { TransferState, makeStateKey } from "@angular/core";
import { HomeData } from "../models/home-data";
import { ApiHttpClient } from "../http/http-client";
import { Product } from "../models/product";
import { Pagination } from "../models/pagination";
import { Review } from "../models/review";

const HOME_DATA_KEY = makeStateKey<HomeData>("homeData");

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/products";
  private readonly adminBaseUrl = "/admin/products";
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly refreshSubject = new BehaviorSubject<void>(void 0);

  // Reactive Data Streams
  readonly homeData$ = this.refreshSubject.pipe(
    switchMap(() => this.fetchHomeData()),
    shareReplay(1)
  );

  readonly featuredProducts$ = this.homeData$.pipe(
    map(data => ({
      data: data.featuredProducts ?? [],
      count: data.featuredProducts?.length ?? 0,
      pageIndex: 1,
      pageSize: data.featuredProducts?.length ?? 0
    } as Pagination<Product>))
  );

  private readonly fallbackHomeData: HomeData = {
    banners: [],
    categories: [],
    newArrivals: [],
    featuredProducts: []
  };

  private readonly HOME_CACHE_KEY = "sherashop_home_cache";

  private fetchHomeData(): Observable<HomeData> {
    // 1. SSR Check: If server already gave us data, use it (instant)
    const ssrData = this.transferState.get(HOME_DATA_KEY, null);
    if (ssrData) {
      if (isPlatformBrowser(this.platformId)) {
        this.transferState.remove(HOME_DATA_KEY);
        this.saveToLocalCache(ssrData);
      }
      return of(ssrData);
    }

    // 2. Browser Local Cache: If we have a previous result, start with it (instant)
    let initialData$ = of(this.fallbackHomeData);
    if (isPlatformBrowser(this.platformId)) {
      const localCached = this.loadFromLocalCache();
      if (localCached) {
        initialData$ = of(localCached);
      }
    }

    // 3. API Fetch: Always fetch fresh data in background
    const apiData$ = this.api.get<HomeData>("/home").pipe(
      tap(data => {
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(HOME_DATA_KEY, data);
        } else {
          this.saveToLocalCache(data);
        }
      }),
      catchError(() => initialData$)
    );

    // Combine: Emit cached first, then API result
    return apiData$.pipe(
      startWith(null as HomeData | null), 
      switchMap(apiData => {
        if (apiData) return of(apiData);
        return initialData$;
      })
    );
  }

  private loadFromLocalCache(): HomeData | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const cached = localStorage.getItem(this.HOME_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private saveToLocalCache(data: HomeData): void {
    if (isPlatformBrowser(this.platformId)) {
      try {
        localStorage.setItem(this.HOME_CACHE_KEY, JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to save home cache", e);
      }
    }
  }

  refreshData(): void {
    this.refreshSubject.next();
  }

  getHomeData(context?: HttpContext): Observable<HomeData> {
    return this.homeData$;
  }

  getProducts(
    params?: any,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context });
  }

  getFeaturedProducts(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.featuredProducts$;
  }

  getNewArrivals(
    limit = 10,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(this.baseUrl, {
      params: { orderBy: "id", order: "desc", pageSize: limit },
      context,
    }).pipe(
      catchError(() => of({ data: [], count: 0 } as any)),
      shareReplay(1)
    );
  }

  getRelatedProducts(
    collectionId?: number,
    categoryId?: number,
    limit = 4,
    context?: HttpContext,
  ): Observable<Pagination<Product>> {
    const params: any = { pageSize: limit };
    if (collectionId) {
      params.collectionId = collectionId;
    } else if (categoryId) {
      params.categoryId = categoryId;
    }
    return this.api.get<Pagination<Product>>(this.baseUrl, { params, context });
  }

  getById(id: number, context?: HttpContext): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${id}`, { context });
  }

  getBySlug(slug: string, context?: HttpContext): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${slug}`, { context });
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`/reviews/products/${productId}`);
  }

  getAdminProducts(): Observable<Product[]> {
    return this.api.get<Product[]>(this.adminBaseUrl);
  }

  getItemProducts(): Observable<Pagination<Product>> {
    return this.api.get<Pagination<Product>>(`${this.baseUrl}/items`);
  }
}
