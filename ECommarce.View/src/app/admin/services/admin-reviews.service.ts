import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface AdminReview {
  id: number;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  productId: number;
  productName: string;
  likes: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminReviewsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/reviews`;

  getAll(): Observable<AdminReview[]> {
    return this.http.get<AdminReview[]>(this.apiUrl);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  update(
    id: number,
    payload: { rating: number; comment: string },
  ): Observable<AdminReview> {
    return this.http.put<AdminReview>(`${this.apiUrl}/${id}`, payload);
  }
}
