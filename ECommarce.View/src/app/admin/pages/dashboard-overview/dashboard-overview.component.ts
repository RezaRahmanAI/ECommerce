import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterModule } from "@angular/router";
import {
  Observable,
  firstValueFrom,
  shareReplay,
  switchMap,
  timer,
} from "rxjs";

import {
  DashboardStats,
  OrderItem,
  PopularProduct,
  SalesData,
  StatusDistribution,
  CustomerGrowth,
  DailyTraffic,
} from "../../models/admin-dashboard.models";

import { AdminDashboardService } from "../../services/admin-dashboard.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { SiteSettingsService } from "../../../core/services/site-settings.service";
import {
  LucideAngularModule,
  Receipt,
  Eye,
  CreditCard,
  Truck,
  Clock,
  Package,
  Users,
  RotateCcw,
} from "lucide-angular";

@Component({
  selector: "app-dashboard-overview",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./dashboard-overview.component.html",
})
export class DashboardOverviewComponent {
  readonly icons = {
    Receipt,
    Eye,
    CreditCard,
    Truck,
    Clock,
    Package,
    Users,
    RotateCcw,
  };
  private adminDashboardService = inject(AdminDashboardService);
  private settingsService = inject(SiteSettingsService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly destroyRef = inject(DestroyRef);

  settings$ = this.settingsService.getSettings();

  private readonly refreshIntervalMs = 15000;
  protected Math = Math;
  protected date = new Date();

  stats$: Observable<DashboardStats> = this.createLiveStream(() =>
    this.adminDashboardService.getStats(),
  );
  recentOrders$: Observable<OrderItem[]> = this.createLiveStream(() =>
    this.adminDashboardService.getRecentOrders(),
  );
  popularProducts$: Observable<PopularProduct[]> = this.createLiveStream(() =>
    this.adminDashboardService.getPopularProducts(),
  );
  salesAnalytics$: Observable<SalesData[]> = this.createLiveStream(() =>
    this.adminDashboardService.getSalesAnalytics(
      this.mapRangeToPeriod(this.selectedRange),
    ),
  );
  orderDistribution$: Observable<StatusDistribution[]> = this.createLiveStream(
    () => this.adminDashboardService.getOrderDistribution(),
  );
  customerGrowth$: Observable<CustomerGrowth[]> = this.createLiveStream(() =>
    this.adminDashboardService.getCustomerGrowth(),
  );
  dailyTraffic$: Observable<DailyTraffic> = this.createLiveStream(() =>
    this.adminDashboardService.getDailyTraffic(),
  );

  timeRanges = ["Last 7 Days", "Last 30 Days", "Last 12 Months", "All Time"];
  selectedRange = this.timeRanges[1];

  onRangeChange(value: string): void {
    this.selectedRange = value;
    // Refresh sales analytics when range changes
    this.salesAnalytics$ = this.createLiveStream(() =>
      this.adminDashboardService.getSalesAnalytics(
        this.mapRangeToPeriod(value),
      ),
    );
  }

  private mapRangeToPeriod(range: string): string {
    switch (range) {
      case "Last 7 Days":
        return "week";
      case "Last 12 Months":
        return "year";
      case "All Time":
        return "all";
      default:
        return "month";
    }
  }

  async exportRevenueReport(): Promise<void> {
    const stats = await firstValueFrom(this.stats$);
    const csvRows = [
      ["Range", "Metric", "Value"],
      [this.selectedRange, "Total Revenue", stats.totalRevenue.toFixed(2)],
      [this.selectedRange, "Total Orders", stats.totalOrders],
      [this.selectedRange, "Delivered Orders", stats.deliveredOrders],
      [this.selectedRange, "Pending Orders", stats.pendingOrders],
      [this.selectedRange, "Returned Orders", stats.returnedOrders],
      [this.selectedRange, "Customer Queries", stats.customerQueries],
      [this.selectedRange, "Total Products", stats.totalProducts],
      [this.selectedRange, "Total Customers", stats.totalCustomers],
      [
        this.selectedRange,
        "Total Purchase Cost",
        stats.totalPurchaseCost.toFixed(2),
      ],
      [
        this.selectedRange,
        "Average Selling Price",
        stats.averageSellingPrice.toFixed(2),
      ],
      [this.selectedRange, "Return Value", stats.returnValue.toFixed(2)],
      [this.selectedRange, "Return Rate", stats.returnRate],
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `revenue-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getChartPath(data: SalesData[]): string {
    if (!data || data.length === 0) return "";

    // SVG dimensions
    const width = 472;
    const height = 150;
    const padding = 20;

    // Find min and max values
    const maxVal = Math.max(...data.map((d) => d.amount));
    const minVal = 0; // Always start from 0 for revenue

    // If no data or flat line
    if (maxVal === minVal) {
      return `M0 ${height - padding} L${width} ${height - padding}`;
    }

    // Calculate points
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y =
        height -
        padding -
        ((d.amount - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return `${x},${y}`;
    });

    // Generate path (simple line for now, could be smooth curve)
    return `M${points.join(" L")}`;
  }

  getMaxAmount(data: SalesData[]): number {
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((d) => d.amount));
  }

  // Helper to generate area fill path (closed loop)
  getAreaPath(data: SalesData[]): string {
    const linePath = this.getChartPath(data);
    if (!linePath) return "";
    return `${linePath} L472 150 L0 150 Z`;
  }

  statusClass(status: OrderItem["status"]): string {
    switch (status) {
      case "Completed":
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "Pending":
      case "Processing":
      case "Confirmed":
      case "Packed":
        return "bg-yellow-100 text-yellow-800";
      case "Shipped":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  private createLiveStream<T>(source: () => Observable<T>): Observable<T> {
    return timer(0, this.refreshIntervalMs).pipe(
      switchMap(() => source()),
      takeUntilDestroyed(this.destroyRef),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
