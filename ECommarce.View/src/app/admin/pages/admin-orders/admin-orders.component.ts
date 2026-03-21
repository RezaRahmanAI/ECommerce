import { CommonModule } from "@angular/common";
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import { FormControl, ReactiveFormsModule, FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from "rxjs";
import {
  LucideAngularModule,
  Printer,
  Download,
  ShoppingBag,
  Package,
  CreditCard,
  RotateCcw,
  Search,
  ChevronDown,
  Check,
  MoreVertical,
  Eye,
  Forward,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-angular";

import {
  Order,
  OrderStatus,
  OrdersQueryParams,
} from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";

interface OrderStats {
  totalOrders: number;
  processing: number;
  totalRevenue: number;
  refundRequests: number;
}

@Component({
  selector: "app-admin-orders",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./admin-orders.component.html",
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  readonly icons = {
    Printer,
    Download,
    ShoppingBag,
    Package,
    CreditCard,
    RotateCcw,
    Search,
    ChevronDown,
    Check,
    MoreVertical,
    Eye,
    Forward,
    XCircle,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Filter,
  };
  private ordersService = inject(OrdersService);
  private destroy$ = new Subject<void>();

  isLoading = false;
  searchControl = new FormControl("", { nonNullable: true });

  orders: Order[] = [];
  filteredOrders: Order[] = [];
  totalResults = 0;
  page = 1;
  pageSize = 10;
  sortColumn: string = "date";
  sortDirection: "asc" | "desc" = "desc";

  statusTabs: OrdersQueryParams["status"][] = [
    "All",
    "Pending",
    "Confirmed",
    "Processing",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];
  selectedStatusTab: OrdersQueryParams["status"] = "All";

  // ... (existing code)

  statusClass(status: string): string {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
      case "Packed":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200";
      case "Shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "Delivered":
        return "bg-accent/40 text-primary dark:bg-accent/20 dark:text-accent";
      case "Cancelled":
      case "Refund":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // ... (existing code)

  getNextStatus(status: string): OrderStatus | null {
    if (status === "Pending") return "Confirmed";
    if (status === "Confirmed") return "Processing";
    if (status === "Processing") return "Packed";
    if (status === "Packed") return "Shipped";
    if (status === "Shipped") return "Delivered";
    return null;
  }

  nextStatusLabel(order: Order): string | null {
    const nextStatus = this.getNextStatus(order.status);
    if (!nextStatus) return null;
    if (nextStatus === "Confirmed") return "Confirm Order";
    if (nextStatus === "Processing") return "Mark as Processing";
    if (nextStatus === "Packed") return "Mark as Packed";
    if (nextStatus === "Shipped") return "Mark as Shipped";
    return "Mark as Delivered";
  }
  startDate: string = "";
  endDate: string = "";

  dateMenuOpen = false;
  actionMenuOpenId: number | null = null;
  actionMenuPosition: { top: number; right: number } | null = null;

  selectedOrderIds = new Set<number>();

  stats: OrderStats = {
    totalOrders: 0,
    processing: 0,
    totalRevenue: 0,
    refundRequests: 0,
  };

  avatarStyles = [
    "bg-orange-100 text-orange-700",
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-gray-200 text-gray-700",
    "bg-pink-100 text-pink-700",
    "bg-teal-100 text-teal-700",
  ];

  ngOnInit(): void {
    this.loadOrders();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.page = 1;
        this.loadOrders();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:click")
  closeMenus(): void {
    this.dateMenuOpen = false;
    this.closeActionMenu();
  }

  @HostListener("window:scroll")
  @HostListener("window:resize")
  closeActionMenuOnViewportChange(): void {
    this.closeActionMenu();
  }

  @HostListener("document:keydown.escape")
  handleEscape(): void {
    this.dateMenuOpen = false;
    this.closeActionMenu();
  }


  selectedStatus: OrdersQueryParams["status"] = "All";
  selectedDateRange: string = "All Time";

  setStatusTab(tab: OrdersQueryParams["status"]): void {
    if (this.selectedStatusTab === tab) {
      return;
    }
    this.selectedStatusTab = tab;
    this.selectedStatus = tab;
    this.page = 1;
    this.loadOrders();
  }

 
  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortColumn = column;
      this.sortDirection = "desc";
    }
    this.page = 1;
    this.loadOrders();
  }
 
  applyCustomDate(): void {
    this.page = 1;
    this.loadOrders();
  }
 
  clearDates(): void {
    this.startDate = "";
    this.endDate = "";
    this.selectedDateRange = "All Time";
    this.page = 1;
    this.loadOrders();
  }

  showMoreFilters(event: Event): void {
    event.stopPropagation();
    window.alert("More filters coming soon.");
  }

  toggleSelectAll(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.orders.forEach((order) => this.selectedOrderIds.add(order.id));
    } else {
      this.orders.forEach((order) => this.selectedOrderIds.delete(order.id));
    }
  }

  toggleSelectOrder(orderId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedOrderIds.add(orderId);
    } else {
      this.selectedOrderIds.delete(orderId);
    }
  }

  toggleRowActions(orderId: number, event: Event): void {
    event.stopPropagation();

    if (this.actionMenuOpenId === orderId) {
      this.closeActionMenu();
      return;
    }

    const trigger = event.currentTarget as HTMLElement | null;
    if (!trigger) {
      this.closeActionMenu();
      return;
    }

    const rect = trigger.getBoundingClientRect();
    this.actionMenuOpenId = orderId;
    this.actionMenuPosition = {
      top: rect.bottom + 8,
      right: Math.max(window.innerWidth - rect.right, 16),
    };
  }

  viewDetails(event: Event): void {
    event.stopPropagation();
    this.closeActionMenu();
  }

  changeStatus(order: Order, status: OrderStatus, event: Event): void {
    event.stopPropagation();
    this.ordersService.updateStatus(order.id, status).subscribe(() => {
      this.loadOrders(false);
    });
    this.closeActionMenu();
  }
 
  markNextStatus(order: Order, event: Event): void {
    event.stopPropagation();
    const nextStatus = this.getNextStatus(order.status);
    if (nextStatus) {
      this.ordersService.updateStatus(order.id, nextStatus).subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.closeMenus();
  }

  cancelOrder(order: Order, event: Event): void {
    event.stopPropagation();
    const shouldCancel = window.confirm("Cancel this order?");
    if (shouldCancel) {
      this.ordersService.updateStatus(order.id, "Cancelled").subscribe(() => {
        this.loadOrders(false);
      });
    }
    this.closeMenus();
  }

  get activeOrder(): Order | undefined {
    return this.orders.find(o => o.id === this.actionMenuOpenId);
  }

  exportOrders(): void {
    this.ordersService.exportOrders(this.buildParams()).subscribe((csv) => {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "orders-export.csv";
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  printOrders(): void {
    this.ordersService.print();
  }

  goToPreviousPage(): void {
    if (this.page === 1) {
      return;
    }
    this.page -= 1;
    this.loadOrders(false);
  }

  goToNextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }
    this.page += 1;
    this.loadOrders(false);
  }

  setPage(page: number | "ellipsis"): void {
    if (
      page === "ellipsis" ||
      page === this.page ||
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }
    this.page = page;
    this.loadOrders(false);
  }

  get paginationItems(): Array<number | "ellipsis"> {
    if (this.totalPages <= 5) {
      return Array.from({ length: this.totalPages }, (_, index) => index + 1);
    }

    const items: Array<number | "ellipsis"> = [];
    const start = Math.max(2, this.page - 1);
    const end = Math.min(this.totalPages - 1, this.page + 1);

    items.push(1);

    if (start > 2) {
      items.push("ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < this.totalPages - 1) {
      items.push("ellipsis");
    }

    items.push(this.totalPages);

    return items;
  }

  isAllVisibleSelected(): boolean {
    return (
      this.orders.length > 0 &&
      this.orders.every((order) => this.selectedOrderIds.has(order.id))
    );
  }

  isIndeterminate(): boolean {
    const selectedVisible = this.orders.filter((order) =>
      this.selectedOrderIds.has(order.id),
    );
    return (
      selectedVisible.length > 0 && selectedVisible.length < this.orders.length
    );
  }

  trackByOrderId(_: number, order: Order): number {
    return order.id;
  }

  get paginationStart(): number {
    if (this.totalResults === 0) {
      return 0;
    }
    return (this.page - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.page * this.pageSize, this.totalResults);
  }

  get totalPages(): number {
    return Math.ceil(this.totalResults / this.pageSize) || 1;
  }

  private buildParams(): OrdersQueryParams {
    return {
      searchTerm: this.searchControl.value,
      status: this.selectedStatus,
      dateRange: this.startDate || this.endDate ? "Custom" : "All Time",
      startDate: this.startDate,
      endDate: this.endDate,
      page: this.page,
      pageSize: this.pageSize,
      sort: this.sortColumn,
      sortDir: this.sortDirection,
    };
  }

  loadOrders(resetSelection = true): void {
    const params = { ...this.buildParams(), status: this.selectedStatus.trim() as any };
    console.log("Loading orders with params:", params);
    this.isLoading = true;
    this.ordersService
      .getOrders(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          console.log("Received orders:", data.items.map(o => `${o.orderNumber}: ${o.status}`));
          this.orders = data.items;
          this.totalResults = data.total;
          this.updateStats(data.items);
          if (resetSelection) {
            this.selectedOrderIds.clear();
          }
          this.isLoading = false;
        },
        error: () => (this.isLoading = false),
      });
  }

  avatarClass(order: Order): string {
    const index = order.id % this.avatarStyles.length;
    return this.avatarStyles[index];
  }

  getCustomerInitials(name: string): string {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  private closeActionMenu(): void {
    this.actionMenuOpenId = null;
    this.actionMenuPosition = null;
  }

  private updateStats(orders: Order[]): void {
    const processing = orders.filter(
      (order) => order.status === "Processing" || order.status === "Pending",
    ).length;
    const refunds = orders.filter((order) => order.status === "Refund").length;
    const revenue = orders.reduce((total, order) => total + order.total, 0);

    this.stats = {
      totalOrders: orders.length,
      processing,
      totalRevenue: revenue,
      refundRequests: refunds,
    };
  }
}
