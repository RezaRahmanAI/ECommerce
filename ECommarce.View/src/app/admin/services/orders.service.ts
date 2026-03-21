import { Injectable, inject } from "@angular/core";
import { HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";

import {
  Order,
  OrderDetail,
  OrderStatus,
  OrdersQueryParams,
} from "../models/orders.models";
import { ApiHttpClient } from "../../core/http/http-client";

@Injectable({
  providedIn: "root",
})
export class OrdersService {
  private readonly api = inject(ApiHttpClient);

  getOrderById(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetail>(`/admin/orders/${id}`);
  }

  getOrders(
    params: OrdersQueryParams,
  ): Observable<{ items: Order[]; total: number }> {
    let queryParams = new HttpParams()
      .set("searchTerm", params.searchTerm || "")
      .set("status", params.status || "All")
      .set("dateRange", params.dateRange || "All Time")
      .set("page", params.page.toString())
      .set("pageSize", params.pageSize.toString());
 
    if (params.sort) {
      queryParams = queryParams.set("sort", params.sort);
    }
    if (params.sortDir) {
      queryParams = queryParams.set("sortDir", params.sortDir);
    }
 
    if (params.startDate) {
      queryParams = queryParams.set("startDate", params.startDate);
    }
    if (params.endDate) {
      queryParams = queryParams.set("endDate", params.endDate);
    }
 
    return this.api.get<{ items: Order[]; total: number }>("/admin/orders", {
      params: queryParams,
    });
  }

  exportOrders(params: OrdersQueryParams): Observable<string> {
    return this.getOrders({ ...params, page: 1, pageSize: 1000 }).pipe(
      map((data) => this.buildCsv(data.items)),
    );
  }

  print(): void {
    window.print();
  }

  updateStatus(orderId: number, status: OrderStatus): Observable<Order> {
    return this.api.post<Order>(`/admin/orders/${orderId}/status`, { status });
  }

  private buildCsv(rows: Order[]): string {
    const header = [
      "Order ID",
      "Customer Name",
      "Date",
      "Items",
      "Details",
      "Total",
      "Status",
    ];
    const csvRows = rows.map((order) => [
      order.orderNumber,
      order.customerName,
      order.createdAt,
      order.itemsCount.toString(),
      order.deliveryDetails,
      order.total.toFixed(2),
      order.status,
    ]);
    return [header, ...csvRows].map((row) => row.join(",")).join("\n");
  }
}
