import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, Observable, map } from "rxjs";

import { CartItem, CartSummary } from "../models/cart";
import { Product } from "../models/product";
import { SettingsService } from "../../admin/services/settings.service";
import { AnalyticsService } from "./analytics.service";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private freeShippingThreshold = 0;
  private shippingCharge = 0;
  private readonly taxRate = 0;
  private readonly storageKey = "cart_items";
  private readonly settingsService = inject(SettingsService);
  private readonly analyticsService = inject(AnalyticsService);

  private readonly cartItemsSubject = new BehaviorSubject<CartItem[]>(
    this.loadCart(),
  );
  readonly cartItems$ = this.cartItemsSubject.asObservable();

  readonly summary$ = this.cartItems$.pipe(
    map((items) => this.calculateSummary(items)),
  );

  constructor() {
    this.cartItems$.subscribe((items) => {
      localStorage.setItem(this.storageKey, JSON.stringify(items));
    });

    // Subscribe to settings updates
    this.settingsService.settings$.subscribe((settings: any) => {
      if (settings) {
        // Global shipping settings removed. Shipping is calculated at checkout based on delivery method.
        // However, we still need the threshold for calculations and UI feedback
        this.freeShippingThreshold = settings.freeShippingThreshold || 0;
        this.shippingCharge = 0; // Shipping charge is calculated at checkout based on method
        // Trigger recalculation
        this.cartItemsSubject.next(this.cartItemsSubject.getValue());
      }
    });

    // Initial load
    this.settingsService.getSettings().subscribe();
  }

  getCart(): Observable<CartItem[]> {
    return this.cartItems$;
  }

  getCartSnapshot(): CartItem[] {
    return this.cartItemsSubject.getValue();
  }

  getSummarySnapshot(): CartSummary {
    return this.calculateSummary(this.cartItemsSubject.getValue());
  }

  addItem(product: Product, quantity = 1, color?: string, size?: string): void {
    const resolvedColor =
      color ?? product.images?.find((i) => !!i.color)?.color ?? "Default";
    const resolvedSize = size ?? product.variants[0]?.size ?? "One Size";
    const items = this.cartItemsSubject.getValue();
    const existing = items.find(
      (item) =>
        item.productId === product.id &&
        item.color === resolvedColor &&
        item.size === resolvedSize,
    );

    if (existing) {
      this.updateQty(existing.id, existing.quantity + quantity);
      this.analyticsService.trackAddToCart({ ...existing, quantity });
      return;
    }

    const newItem = this.createCartItem(
      product,
      quantity,
      resolvedColor,
      resolvedSize,
    );
    const nextItems = [...items, newItem];
    this.cartItemsSubject.next(nextItems);
    this.analyticsService.trackAddToCart(newItem);
  }

  removeItem(cartItemId: string): void {
    this.cartItemsSubject.next(
      this.cartItemsSubject.getValue().filter((item) => item.id !== cartItemId),
    );
  }

  updateQty(cartItemId: string, quantity: number): void {
    const sanitizedQty = Math.max(0, quantity);
    const nextItems = this.cartItemsSubject
      .getValue()
      .map((item) =>
        item.id === cartItemId ? { ...item, quantity: sanitizedQty } : item,
      )
      .filter((item) => item.quantity > 0);
    this.cartItemsSubject.next(nextItems);
  }

  clearCart(): void {
    this.cartItemsSubject.next([]);
  }

  private createCartItem(
    product: Product,
    quantity: number,
    color?: string,
    size?: string,
  ): CartItem {
    const resolvedColor =
      color ?? product.images?.find((i) => !!i.color)?.color ?? "Default";
    const resolvedSize = size ?? product.variants[0]?.size ?? "One Size";

    return {
      id: `cart-${product.id}-${resolvedColor}-${resolvedSize}-${Math.random().toString(36).slice(2, 8)}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      color: resolvedColor,
      size: resolvedSize,
      imageUrl:
        product.images.find((i) => i.isPrimary)?.imageUrl ||
        product.imageUrl ||
        "",
      imageAlt:
        product.images.find((i) => i.isPrimary)?.altText || product.name,
    };
  }

  private calculateSummary(items: CartItem[]): CartSummary {
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const tax = Number((subtotal * this.taxRate).toFixed(2));
    const shipping =
      subtotal >= this.freeShippingThreshold ? 0 : this.shippingCharge;
    const total = Number((subtotal + tax + shipping).toFixed(2));
    const freeShippingRemaining = Math.max(
      this.freeShippingThreshold - subtotal,
      0,
    );
    const freeShippingProgress = Math.min(
      (subtotal / this.freeShippingThreshold) * 100,
      100,
    );
    const itemsCount = items.reduce((total, item) => total + item.quantity, 0);

    return {
      itemsCount,
      subtotal,
      tax,
      shipping,
      total,
      freeShippingThreshold: this.freeShippingThreshold,
      freeShippingRemaining,
      freeShippingProgress,
    };
  }

  private loadCart(): CartItem[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) {
      return [];
    }

    try {
      return JSON.parse(stored) as CartItem[];
    } catch {
      return [];
    }
  }
}
