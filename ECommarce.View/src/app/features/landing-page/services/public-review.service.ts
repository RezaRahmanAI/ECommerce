import { Injectable, inject } from "@angular/core";
import { map, Observable, shareReplay, catchError, of } from "rxjs";
import { ApiHttpClient } from "../../../core/http/http-client";

interface PaginatedPublicReviewsResponse {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  reviews: PublicReview[];
}

export interface PublicReview {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  isVerifiedPurchase: boolean;
  reviewImage?: string;
  likes: number;
}

@Injectable({ providedIn: "root" })
export class PublicReviewService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/reviews";
  
  // Cache for reviews
  private reviewsCache = new Map<number, Observable<PublicReview[]>>();
  private featuredCache$: Observable<PublicReview[]> | null = null;

  getReviewsByProduct(productId: number): Observable<PublicReview[]> {
    if (!this.reviewsCache.has(productId)) {
      this.reviewsCache.set(productId, this.api
        .get<PublicReview[] | PaginatedPublicReviewsResponse>(`${this.baseUrl}/products/${productId}`)
        .pipe(
          map((response: any) => Array.isArray(response) ? response : response?.reviews ?? []),
          shareReplay(1),
          catchError(() => of([]))
        ));
    }
    return this.reviewsCache.get(productId)!;
  }

  getFeaturedReviews(): Observable<PublicReview[]> {
    if (!this.featuredCache$) {
      this.featuredCache$ = this.api.get<PublicReview[]>(`${this.baseUrl}/featured`).pipe(
        shareReplay(1),
        catchError(() => of([]))
      );
    }
    return this.featuredCache$;
  }
}
