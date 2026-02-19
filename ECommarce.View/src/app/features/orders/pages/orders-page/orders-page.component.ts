import { CommonModule } from "@angular/common";
import { Component, inject } from "@angular/core";
import { RouterModule } from "@angular/router";
import { combineLatest, map } from "rxjs";

import { AuthStateService } from "../../../../core/services/auth-state.service";
import { OrderService } from "../../../../core/services/order.service";
import { Order } from "../../../../core/models/order";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

@Component({
  selector: "app-orders-page",
  standalone: true,
  imports: [CommonModule, RouterModule, PriceDisplayComponent],
  templateUrl: "./orders-page.component.html",
  styleUrl: "./orders-page.component.css",
})
export class OrdersPageComponent {
  private readonly authState = inject(AuthStateService);
  private readonly orderService = inject(OrderService);

  readonly orders$ = combineLatest([
    this.authState.user$,
    this.orderService.orders$,
  ]).pipe(map(([user, orders]) => (user ? orders : [])));

  trackByOrder(_: number, order: Order): number {
    return order.id;
  }
}
