import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser, isPlatformServer } from "@angular/common";
import { HttpContext } from "@angular/common/http";
import { Observable, of, shareReplay, BehaviorSubject, switchMap } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
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

  private fetchHomeData(): Observable<HomeData> {
    // BROWSER: Check if SSR already fetched this data
    if (isPlatformBrowser(this.platformId)) {
      const ssrData = this.transferState.get(HOME_DATA_KEY, null);
      if (ssrData) {
        this.transferState.remove(HOME_DATA_KEY); // Consume it once
        return of(ssrData);
      }
    }

    // SERVER or no cached data: fetch from API
    return this.api.get<HomeData>("/home").pipe(
      tap(data => {
        // SERVER: Store data in TransferState so browser can reuse it
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(HOME_DATA_KEY, data);
        }
      }),
      catchError(() => of(this.fallbackHomeData))
    );
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
