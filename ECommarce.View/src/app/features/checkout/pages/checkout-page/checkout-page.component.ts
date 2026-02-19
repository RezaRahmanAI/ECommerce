import { Component, DestroyRef, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  switchMap,
  tap,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CartItem } from "../../../../core/models/cart";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
  ],
  templateUrl: "./checkout-page.component.html",
  styleUrl: "./checkout-page.component.css",
})
export class CheckoutPageComponent {
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  readonly imageUrlService = inject(ImageUrlService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryDetails: ["", [Validators.required, Validators.minLength(5)]],
    deliveryMethodId: [0, Validators.required],
  });

  isLoading = false;
  errorMessage = "";
  didAutofill = false;
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;

  private readonly settingsService = inject(SettingsService);

  readonly summary$ = this.cartService.summary$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.summary$,
    of(null), // Placeholder for animation or extra data if needed
  ]).pipe(
    map(([cartItems, summary]) => {
      // Adjust summary shipping if a method is selected
      const shipping = this.selectedMethod
        ? this.selectedMethod.cost
        : summary.shipping;
      const total = summary.subtotal + summary.tax + shipping;

      return {
        cartItems,
        summary: { ...summary, shipping, total },
        deliveryMethods: this.deliveryMethods,
      };
    }),
  );

  constructor() {
    this.checkoutService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.checkoutForm.patchValue({
          fullName: state.fullName,
          phone: state.phone,
          address: state.address,
          deliveryDetails: state.deliveryDetails,
        });
      });

    this.checkoutForm.controls.phone.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        tap((value) => {
          if (value.length < 7) {
            this.didAutofill = false;
          }
        }),
        filter((value) => value.length >= 7),
        switchMap((phone) =>
          this.customerOrderApi
            .lookupCustomer(phone)
            .pipe(catchError(() => of(null))),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((customer) => {
        if (customer) {
          this.didAutofill = true;
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
            },
            { emitEvent: false },
          );
          return;
        }

        this.didAutofill = false;
      });

    // Load delivery methods
    this.settingsService.getPublicDeliveryMethods().subscribe((methods) => {
      this.deliveryMethods = methods;
      if (methods.length > 0) {
        const defaultMethod =
          methods.find((m) => m.name.toLowerCase().includes("inside")) ||
          methods[0];
        this.checkoutForm.patchValue({ deliveryMethodId: defaultMethod.id });
        this.selectedMethod = defaultMethod;
      }
    });

    // Watch for delivery method changes
    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
      });
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid || this.isLoading) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = "";
    this.persistCheckoutState();
    this.checkoutService
      .createOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          this.isLoading = false;
          if (!orderId) {
            return;
          }
          void this.router.navigate(["/order-confirmation", orderId]);
        },
        error: (error: Error) => {
          this.isLoading = false;
          this.errorMessage = error.message ?? "Unable to place order.";
        },
      });
  }

  trackCartItem(_: number, item: CartItem): string {
    return item.id;
  }

  private persistCheckoutState(): void {
    this.checkoutService.updateState({
      fullName: this.checkoutForm.controls.fullName.value ?? "",
      phone: this.checkoutForm.controls.phone.value ?? "",
      address: this.checkoutForm.controls.address.value ?? "",
      deliveryDetails: this.checkoutForm.controls.deliveryDetails.value ?? "",
      deliveryMethodId:
        this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}
