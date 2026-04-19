import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";
import { ApiHttpClient } from "../../core/http/http-client";

export interface AdminReview {
  id: number;
  customerName: string;
  customerAvatar: string;
  reviewImage?: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  date: string;
  productId: number;
  productName: string;
  isFeatured: boolean;
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

  create(payload: any): Observable<AdminReview> {
    return this.api.post<AdminReview>(this.baseUrl, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.baseUrl}/${id}`);
  }

  update(id: number, payload: any): Observable<AdminReview> {
    return this.api.put<AdminReview>(`${this.baseUrl}/${id}`, payload);
  }

  uploadImage(file: File): Observable<string[]> {
    const formData = new FormData();
    formData.append("files", file);
    return this.api.post<string[]>(`${this.baseUrl}/upload-image`, formData);
  }
}
