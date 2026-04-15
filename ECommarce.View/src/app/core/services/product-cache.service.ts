import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { CacheInterceptor } from '../interceptors/cache.interceptor'; 
import { environment } from '../../../environments/environment';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductCacheService {

  // In-flight request deduplication map
  private inFlightRequests = new Map<string, Observable<any>>();

  constructor(
    private http: HttpClient,
    private cacheInterceptor: CacheInterceptor
  ) { }

  /**
   * Fetches products using shareReplay to deduplicate in-flight concurrent requests.
   * Leverages HttpInterceptor for subsequent cached hits.
   */
  getProducts(categoryId: number, page: number, sort: string): Observable<Product[]> {
    let params = new HttpParams();
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    if (page) params = params.set('pageIndex', page.toString()); // API expects pageIndex typically
    if (sort) params = params.set('sort', sort);

    const url = `${environment.apiBaseUrl}/products`;
    const dedupeKey = url + '?' + params.toString();

    // Check if there is already a pending active request for this exact endpoint
    if (!this.inFlightRequests.has(dedupeKey)) {
      const request$ = this.http.get<Product[]>(url, { params }).pipe(
        // Retain 1 response, deduplicate concurrent subscribers
        shareReplay(1)
      );
      this.inFlightRequests.set(dedupeKey, request$);

      // Clean up mapping after observable completion to prevent memory leaks
      request$.subscribe({
        complete: () => this.inFlightRequests.delete(dedupeKey),
        error: () => this.inFlightRequests.delete(dedupeKey)
      });
    }

    return this.inFlightRequests.get(dedupeKey)!;
  }

  /**
   * Called from Admin component after updating a product.
   */
  adminInvalidateProductCache(): void {
    // Bust client side angular cache
    this.cacheInterceptor.bust('/api/products');
  }
}
