import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";
import { Observable } from "rxjs";

export interface VariantInventoryDto {
  variantId: number;
  sku: string;
  size: string;
  stockQuantity: number;
}

export interface ProductInventoryDto {
  productId: number;
  productName: string;
  productSku: string;
  imageUrl: string;
  totalStock: number;
  variants: VariantInventoryDto[];
}

@Injectable({
  providedIn: "root",
})
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/products/inventory`;

  getInventory(): Observable<ProductInventoryDto[]> {
    return this.http.get<ProductInventoryDto[]>(this.apiUrl);
  }

  updateStock(variantId: number, quantity: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/${variantId}`, { quantity });
  }
}
