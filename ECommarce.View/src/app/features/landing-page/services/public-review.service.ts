import { Injectable, inject } from "@angular/core";
import { map, Observable } from "rxjs";
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

  getReviewsByProduct(productId: number): Observable<PublicReview[]> {
    return this.api
      .get<PublicReview[] | PaginatedPublicReviewsResponse>(`${this.baseUrl}/products/${productId}`)
      .pipe(map((response) => Array.isArray(response) ? response : response.reviews ?? []));
  }

  getFeaturedReviews(): Observable<PublicReview[]> {
    return this.api.get<PublicReview[]>(`${this.baseUrl}/featured`);
  }
}
