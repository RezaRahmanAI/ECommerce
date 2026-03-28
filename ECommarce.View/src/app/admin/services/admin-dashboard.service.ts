import { Injectable, inject } from "@angular/core";
import { Observable, shareReplay, catchError, of } from "rxjs";

import {
  DashboardStats,
  OrderItem,
  PopularProduct,
  SalesData,
  StatusDistribution,
  CustomerGrowth,
  DailyTraffic,
  CategorySales,
} from "../models/admin-dashboard.models";

import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: "root",
})
export class AdminDashboardService {
  private readonly api = inject(ApiHttpClient);

  // Cache for dashboard data
  private statsCache$: Observable<DashboardStats> | null = null;
  private ordersCache$: Observable<OrderItem[]> | null = null;
  private productsCache$: Observable<PopularProduct[]> | null = null;
  private orderDistCache$: Observable<StatusDistribution[]> | null = null;
  private customerGrowthCache$: Observable<CustomerGrowth[]> | null = null;
  private salesByCategoryCache$: Observable<CategorySales[]> | null = null;

  getStats(): Observable<DashboardStats> {
    if (!this.statsCache$) {
      this.statsCache$ = this.api.get<DashboardStats>("/admin/dashboard/stats").pipe(
        shareReplay(1),
        catchError(() => of({} as DashboardStats))
      );
    }
    return this.statsCache$;
  }

  getRecentOrders(): Observable<OrderItem[]> {
    if (!this.ordersCache$) {
      this.ordersCache$ = this.api.get<OrderItem[]>("/admin/dashboard/orders/recent").pipe(
        shareReplay(1),
        catchError(() => of([] as OrderItem[]))
      );
    }
    return this.ordersCache$;
  }

  getPopularProducts(): Observable<PopularProduct[]> {
    if (!this.productsCache$) {
      this.productsCache$ = this.api.get<PopularProduct[]>("/admin/dashboard/products/popular").pipe(
        shareReplay(1),
        catchError(() => of([] as PopularProduct[]))
      );
    }
    return this.productsCache$;
  }

  getSalesAnalytics(period: string = "month"): Observable<SalesData[]> {
    return this.api.get<SalesData[]>(
      `/admin/dashboard/analytics/sales?period=${period}`,
    ).pipe(
      shareReplay(1),
      catchError(() => of([] as SalesData[]))
    );
  }

  getOrderDistribution(): Observable<StatusDistribution[]> {
    if (!this.orderDistCache$) {
      this.orderDistCache$ = this.api.get<StatusDistribution[]>(
        "/admin/dashboard/analytics/order-distribution",
      ).pipe(
        shareReplay(1),
        catchError(() => of([] as StatusDistribution[]))
      );
    }
    return this.orderDistCache$;
  }

  getCustomerGrowth(): Observable<CustomerGrowth[]> {
    if (!this.customerGrowthCache$) {
      this.customerGrowthCache$ = this.api.get<CustomerGrowth[]>(
        "/admin/dashboard/analytics/customer-growth",
      ).pipe(
        shareReplay(1),
        catchError(() => of([] as CustomerGrowth[]))
      );
    }
    return this.customerGrowthCache$;
  }

  getDailyTraffic(): Observable<DailyTraffic> {
    return this.api.get<DailyTraffic>("/analytics/daily").pipe(
      shareReplay(1),
      catchError(() => of({} as DailyTraffic))
    );
  }
  
  getSalesByCategory(): Observable<CategorySales[]> {
    if (!this.salesByCategoryCache$) {
      this.salesByCategoryCache$ = this.api.get<CategorySales[]>(
        "/admin/dashboard/analytics/sales-by-category",
      ).pipe(
        shareReplay(1),
        catchError(() => of([] as CategorySales[]))
      );
    }
    return this.salesByCategoryCache$;
  }

  // Clear cache to refresh data
  clearCache(): void {
    this.statsCache$ = null;
    this.ordersCache$ = null;
    this.productsCache$ = null;
    this.orderDistCache$ = null;
    this.customerGrowthCache$ = null;
    this.salesByCategoryCache$ = null;
  }
}
