import { Injectable, inject } from "@angular/core";
import { Observable, of } from "rxjs";

import { ApiHttpClient } from "../http/http-client";
import { MOCK_REVIEWS } from "../data/mock-reviews";
import { Product } from "../models/product";
import { Review } from "../models/review";

@Injectable({
  providedIn: "root",
})
export class ProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly baseUrl = "/products";
  private readonly adminBaseUrl = "/admin/products";

  getProducts(params?: any): Observable<Product[]> {
    return this.api.get<Product[]>(this.baseUrl, { params });
  }

  getFeaturedProducts(limit = 10): Observable<Product[]> {
    return this.api.get<Product[]>(this.baseUrl, {
      params: { limit, sort: "sortOrder" } as any,
    });
  }

  getNewArrivals(limit = 10): Observable<Product[]> {
    return this.api.get<Product[]>(this.baseUrl, {
      params: { limit, isNew: true } as any,
    });
  }

  getRelatedProducts(
    collectionId?: number,
    categoryId?: number,
    limit = 4,
  ): Observable<Product[]> {
    const params: any = { limit };
    if (collectionId) {
      params.collectionId = collectionId;
    } else if (categoryId) {
      params.categoryId = categoryId;
    }
    return this.api.get<Product[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${id}`);
  }

  getBySlug(slug: string): Observable<Product> {
    return this.api.get<Product>(`${this.baseUrl}/${slug}`);
  }

  getReviewsByProductId(productId: number): Observable<Review[]> {
    return of(MOCK_REVIEWS.filter((review) => review.productId === productId));
  }

  // Admin APIs
  getAdminProducts(params?: any): Observable<Product[]> {
    return this.api.get<Product[]>(this.adminBaseUrl, { params });
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>(this.adminBaseUrl, product);
  }

  deleteProduct(id: number): Observable<any> {
    return this.api.delete(`${this.adminBaseUrl}/${id}`);
  }
}
