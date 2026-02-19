import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { OrderService } from "../../../../core/services/order.service";
import { Order, OrderItem, OrderStatus } from "../../../../core/models/order";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-order-confirmation-page",
  standalone: true,
  imports: [CommonModule, RouterModule, PriceDisplayComponent],
  templateUrl: "./order-confirmation-page.component.html",
  styleUrl: "./order-confirmation-page.component.css",
})
export class OrderConfirmationPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);
  readonly imageUrlService = inject(ImageUrlService);

  readonly statusSteps = [
    OrderStatus.Confirmed,
    OrderStatus.Processing,
    OrderStatus.Shipped,
    OrderStatus.Delivered,
  ];
  readonly OrderStatus = OrderStatus;

  readonly order$ = combineLatest([
    this.route.paramMap,
    this.orderService.orders$,
  ]).pipe(
    map(([params, orders]) => {
      const orderId = Number(params.get("orderId"));
      return orders.find((order) => order.id === orderId) || orders[0];
    }),
  );

  stepState(order: Order, step: OrderStatus): "done" | "active" | "pending" {
    const currentIndex = this.statusSteps.indexOf(order.status);
    const stepIndex = this.statusSteps.indexOf(step);

    if (stepIndex < currentIndex) {
      return "done";
    }
    if (stepIndex === currentIndex) {
      return "active";
    }
    return "pending";
  }

  stepIconClasses(order: Order, step: OrderStatus): string {
    const state = this.stepState(order, step);
    if (state === "pending") {
      return "w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-400 flex items-center justify-center z-10";
    }
    if (state === "active") {
      return "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center z-10 border-4 border-white dark:border-background-dark shadow-sm";
    }
    return "w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center z-10";
  }

  stepLabelClasses(order: Order, step: OrderStatus): string {
    const state = this.stepState(order, step);
    if (state === "pending") {
      return "mt-2 text-sm font-medium text-gray-400";
    }
    return "mt-2 text-sm font-semibold";
  }

  connectorClasses(order: Order, index: number): string {
    const currentIndex = this.statusSteps.indexOf(order.status);
    return currentIndex > index
      ? "flex-1 h-1 bg-primary mx-2 -mt-6"
      : "flex-1 h-1 bg-gray-200 dark:bg-gray-700 mx-2 -mt-6";
  }

  trackOrderItem(_: number, item: OrderItem): number {
    return item.productId;
  }
}
