import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdultProduct, AdultProductCreateUpdatePayload } from '../../../admin/models/adult-product.models';
import { ApiHttpClient } from "../../../core/http/http-client";

@Injectable({
  providedIn: 'root'
})
export class AdultProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly apiUrl = `/adultproducts`;

  getBySlug(slug: string): Observable<AdultProduct> {
    return this.api.get<AdultProduct>(`${this.apiUrl}/${slug}`);
  }

  getById(id: number): Observable<AdultProduct> {
    return this.api.get<AdultProduct>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<AdultProduct[]> {
    return this.api.get<AdultProduct[]>(this.apiUrl);
  }

  create(product: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.api.post<AdultProduct>(this.apiUrl, product);
  }

  update(id: number, product: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.api.put<AdultProduct>(`${this.apiUrl}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/${id}`);
  }
}
