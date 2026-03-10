import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface AdminReview {
  id: number;
  customerName: string;
  customerAvatar: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  date: string;
  productId: number;
  productName: string;
  reviewImage?: string;
  likes: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminReviewsService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/admin/reviews";

  getAll(): Observable<AdminReview[]> {
    return this.api.get<AdminReview[]>(this.baseUrl);
  }

  uploadImage(file: File): Observable<string[]> {
    const formData = new FormData();
    formData.append("files", file);
    return this.api.post<string[]>(`${this.baseUrl}/upload-media`, formData);
  }

  delete(id: number): Observable<void> {
    return this.api.post<void>(`${this.baseUrl}/${id}/delete`, {});
  }

  update(
    id: number,
    payload: { rating: number; comment: string; reviewImage?: string | null },
  ): Observable<AdminReview> {
    return this.api.post<AdminReview>(`${this.baseUrl}/${id}`, payload);
  }
}
