import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../environments/environment";

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
}

export interface Cart {
  id: number;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

@Injectable({
  providedIn: "root",
})
export class CartService {
  private readonly API_URL = `${environment.apiBaseUrl}/cart`;

  constructor(private http: HttpClient) {}

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(this.API_URL);
  }

  addToCart(productId: number, quantity: number = 1): Observable<Cart> {
    return this.http.post<Cart>(`${this.API_URL}/items`, {
      productId,
      quantity,
    });
  }

  updateCartItem(itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.API_URL}/items/${itemId}`, { quantity });
  }

  removeFromCart(itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/items/${itemId}`);
  }

  clearCart(): Observable<void> {
    return this.http.delete<void>(this.API_URL);
  }
}
