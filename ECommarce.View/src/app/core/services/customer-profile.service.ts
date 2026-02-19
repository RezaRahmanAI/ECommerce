import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { BehaviorSubject, Observable, map, tap } from "rxjs";
import { environment } from "../../../environments/environment";
import { Order, OrderStatus } from "../models/order";

export interface CustomerProfile {
  id: number;
  phone: string;
  name: string;
  address: string;
  deliveryDetails?: string;
  createdAt: string;
}

export interface CustomerProfileRequest {
  phone: string;
  name: string;
  address: string;
  deliveryDetails?: string;
}

@Injectable({
  providedIn: "root",
})
export class CustomerProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/customers`;
  private readonly storageKey = "customer_phone";

  private readonly phoneSubject = new BehaviorSubject<string | null>(
    this.getStoredPhone(),
  );
  readonly phone$ = this.phoneSubject.asObservable();

  getStoredPhone(): string | null {
    return localStorage.getItem(this.storageKey);
  }

  storePhone(phone: string): void {
    localStorage.setItem(this.storageKey, phone);
    this.phoneSubject.next(phone);
  }

  clearPhone(): void {
    localStorage.removeItem(this.storageKey);
    this.phoneSubject.next(null);
  }

  getProfile(phone: string): Observable<CustomerProfile> {
    const params = new HttpParams().set("phone", phone);
    return this.http.get<CustomerProfile>(`${this.apiUrl}/lookup`, { params });
  }

  updateProfile(request: CustomerProfileRequest): Observable<CustomerProfile> {
    return this.http
      .post<CustomerProfile>(`${this.apiUrl}/profile`, request)
      .pipe(
        tap((profile) => {
          if (profile.phone) {
            this.storePhone(profile.phone);
          }
        }),
      );
  }

  getOrders(phone: string): Observable<Order[]> {
    const params = new HttpParams().set("phone", phone);
    return this.http
      .get<any[]>(`${this.apiUrl}/orders`, { params })
      .pipe(map((dtos) => dtos.map(this.mapOrderDtoToOrder)));
  }

  private mapOrderDtoToOrder(dto: any): Order {
    return {
      id: dto.id,
      orderNumber: dto.orderNumber,
      customerName: dto.customerName || dto.name,
      customerPhone: dto.customerPhone || dto.phone,
      shippingAddress: dto.shippingAddress || dto.address,
      deliveryDetails: dto.deliveryDetails,
      subTotal: dto.subTotal || dto.total || 0,
      tax: dto.tax || 0,
      shippingCost: dto.shippingCost || 0,
      total: dto.total || 0,
      itemsCount:
        dto.itemsCount ||
        (dto.items || []).reduce(
          (sum: number, i: any) => sum + (i.quantity || 0),
          0,
        ),
      status: dto.status as OrderStatus,
      createdAt: dto.createdAt,
      items: (dto.items || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.price || 0,
        totalPrice:
          item.totalPrice ||
          (item.unitPrice || item.price || 0) * item.quantity ||
          0,
        color: item.color,
        size: item.size,
        imageUrl: item.imageUrl || "",
      })),
    };
  }
}
