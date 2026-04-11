import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdultProduct, AdultProductCreateUpdatePayload } from '../models/adult-product.models';
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: 'root'
})
export class AdultProductService {
  private readonly api = inject(ApiHttpClient);
  private readonly apiUrl = `/adultproducts`;

  getAll(): Observable<AdultProduct[]> {
    return this.api.get<AdultProduct[]>(this.apiUrl);
  }

  getById(id: number): Observable<AdultProduct> {
    return this.api.get<AdultProduct>(`${this.apiUrl}/${id}`);
  }

  create(payload: AdultProductCreateUpdatePayload): Observable<AdultProduct> {
    return this.api.post<AdultProduct>(this.apiUrl, payload);
  }

  update(id: number, payload: AdultProductCreateUpdatePayload): Observable<void> {
    return this.api.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`${this.apiUrl}/${id}`);
  }
}
