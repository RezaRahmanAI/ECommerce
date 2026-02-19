import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface SalesData {
  date: string;
  amount: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface CustomerGrowth {
  date: string;
  count: number;
}

export interface TopProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  soldCount: number;
  imageUrl: string;
}

@Injectable({
  providedIn: "root",
})
export class AdminAnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/admin/analytics`;

  getSalesData(
    period: "week" | "month" | "year" = "month",
  ): Observable<SalesData[]> {
    return this.http.get<SalesData[]>(`${this.apiUrl}/sales`, {
      params: { period },
    });
  }

  getOrderStatusDistribution(): Observable<StatusDistribution[]> {
    return this.http.get<StatusDistribution[]>(
      `${this.apiUrl}/orders/distribution`,
    );
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    return this.http.get<CustomerGrowth[]>(`${this.apiUrl}/customers/growth`);
  }

  getTopProducts(): Observable<TopProduct[]> {
    return this.http.get<TopProduct[]>(`${this.apiUrl}/products/top`);
  }
}
