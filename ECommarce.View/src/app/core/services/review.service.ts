import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";
import { Review, CreateReview } from "../models/review";

@Injectable({
  providedIn: "root",
})
export class ReviewService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.apiUrl}/reviews/products/${productId}`,
    );
  }

  getFeaturedReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/featured`);
  }

  addReview(productId: number, review: CreateReview): Observable<Review> {
    return this.http.post<Review>(
      `${this.apiUrl}/reviews/products/${productId}`,
      review,
    );
  }
}
