import { Injectable, inject, PLATFORM_ID, TransferState, makeStateKey } from "@angular/core";
import { isPlatformServer } from "@angular/common";
import { Observable, of, tap } from "rxjs";
import { Review, CreateReview } from "../models/review";
import { ApiHttpClient } from "../http/http-client";

@Injectable({
  providedIn: "root",
})
export class ReviewService {
  private readonly api = inject(ApiHttpClient);
  private readonly transferState = inject(TransferState);
  private readonly platformId = inject(PLATFORM_ID);
  
  private readonly baseUrl = "/reviews";
  private readonly FEATURED_REVIEWS_KEY = makeStateKey<Review[]>("featured_reviews_data");

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.api.get<Review[]>(`${this.baseUrl}/products/${productId}`);
  }

  getFeaturedReviews(): Observable<Review[]> {
    const isServer = isPlatformServer(this.platformId);

    if (this.transferState.hasKey(this.FEATURED_REVIEWS_KEY)) {
      return of(this.transferState.get(this.FEATURED_REVIEWS_KEY, []));
    }

    return this.api.get<Review[]>(`${this.baseUrl}/featured`).pipe(
      tap(data => {
        if (isServer) {
          this.transferState.set(this.FEATURED_REVIEWS_KEY, data);
        }
      })
    );
  }

  addReview(productId: number, review: CreateReview): Observable<Review> {
    return this.api.post<Review>(
      `${this.baseUrl}/products/${productId}`,
      review,
    );
  }
}
