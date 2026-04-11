import { CommonModule, isPlatformBrowser } from "@angular/common";
import { Component, OnInit, inject, PLATFORM_ID } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Observable, switchMap } from "rxjs";
import { OrderDetail, OrderStatus } from "../../models/orders.models";
import { OrdersService } from "../../services/orders.service";
import { PriceDisplayComponent } from "../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import {
  LucideAngularModule,
  ChevronLeft,
  Printer,
  Clock,
  ArrowRight,
  MapPin,
  CreditCard,
  Package,
  History,
  User,
  Mail,
  Phone,
  ChevronDown,
} from "lucide-angular";

@Component({
  selector: "app-admin-order-details",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./admin-order-details.component.html",
})
export class AdminOrderDetailsComponent implements OnInit {
  readonly icons = {
    ChevronLeft,
    Printer,
    Clock,
    ArrowRight,
    MapPin,
    CreditCard,
    Package,
    History,
    User,
    Mail,
    Phone,
    ChevronDown,
  };
  private route = inject(ActivatedRoute);
  private ordersService = inject(OrdersService);
  readonly imageUrlService = inject(ImageUrlService);
  private platformId = inject(PLATFORM_ID);

  order$: Observable<OrderDetail> | null = null;

  statusOptions: OrderStatus[] = [
    "Pending",
    "Confirmed",
    "Processing",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

  ngOnInit(): void {
    this.order$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const id = Number(params.get("id"));
        return this.ordersService.getOrderById(id);
      }),
    );
  }

  statusClass(status: OrderStatus): string {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
      case "Confirmed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200";
      case "Processing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200";
      case "Shipped":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "Delivered":
        return "bg-accent/40 text-primary dark:bg-accent/20 dark:text-accent";
      case "Cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      case "Refund":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  updateStatus(orderId: number, newStatus: OrderStatus): void {
    this.ordersService.updateStatus(orderId, newStatus).subscribe(() => {
      this.refreshOrder();
    });
  }

  onStatusChange(orderId: number, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as OrderStatus;
    if (newStatus) {
      this.updateStatus(orderId, newStatus);
    }
  }

  private refreshOrder(): void {
    const id = Number(this.route.snapshot.paramMap.get("id"));
    this.order$ = this.ordersService.getOrderById(id);
  }

  printInvoice(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.print();
    }
  }
}
