import { Component, DestroyRef, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
  ],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
})
export class LandingPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  private readonly settingsService = inject(SettingsService);
  readonly imageUrlService = inject(ImageUrlService);

  product: Product | null = null;
  isLoading = false;
  isOrdering = false;
  errorMessage = "";
  didAutofill = false;
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryDetails: ["Standard Delivery", [Validators.required]],
    deliveryMethodId: [0, Validators.required],
    selectedColor: ["", Validators.required],
    selectedSize: ["", Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadProductAndSettings();
    this.setupFormWatchers();
  }

  private loadProductAndSettings(): void {
    this.isLoading = true;

    combineLatest([
      this.route.paramMap.pipe(
        map((params) => params.get("slug") ?? ""),
        filter((slug) => slug.length > 0),
        switchMap((slug) => this.productService.getBySlug(slug)),
      ),
      this.settingsService.getPublicDeliveryMethods(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([product, methods]) => {
          this.product = product;
          this.deliveryMethods = methods;
          this.isLoading = false;

          if (product) {
            // Set defaults
            const colors = Array.from(
              new Set(product.images?.map((i) => i.color).filter(Boolean)),
            );
            const sizes = Array.from(
              new Set(product.variants?.map((v) => v.size).filter(Boolean)),
            );

            this.checkoutForm.patchValue({
              selectedColor: colors[0] ?? "",
              selectedSize: sizes[0] ?? "",
            });
          }

          if (methods.length > 0) {
            const defaultMethod =
              methods.find((m) => m.name.toLowerCase().includes("inside")) ||
              methods[0];
            this.checkoutForm.patchValue({
              deliveryMethodId: defaultMethod.id,
            });
            this.selectedMethod = defaultMethod;
          }
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = "Product not found.";
        },
      });
  }

  private setupFormWatchers(): void {
    this.checkoutForm.controls.phone.valueChanges
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
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
        }
      });

    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
      });
  }

  get total(): number {
    if (!this.product) return 0;
    const subtotal =
      this.product.price * this.checkoutForm.controls.quantity.value;
    const shipping = this.selectedMethod?.cost ?? 0;
    return subtotal + shipping;
  }

  placeOrder(): void {
    if (this.checkoutForm.invalid || this.isOrdering || !this.product) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    this.errorMessage = "";

    // For landing page, we bypass the normal cart and create a "virtual" cart with just this item
    const form = this.checkoutForm.getRawValue();

    // 1. Prepare cart service with just this item (Clear others)
    this.cartService.clearCart();
    this.cartService.addItem(
      this.product,
      form.quantity,
      form.selectedColor,
      form.selectedSize,
    );

    // 2. Persist state to checkout service
    this.checkoutService.updateState({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      deliveryDetails: form.deliveryDetails,
      deliveryMethodId: form.deliveryMethodId,
    });

    // 3. Place order
    this.checkoutService
      .createOrder()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderId) => {
          this.isOrdering = false;
          if (orderId) {
            void this.router.navigate(["/order-confirmation", orderId]);
          }
        },
        error: (error: Error) => {
          this.isOrdering = false;
          this.errorMessage = error.message ?? "Unable to place order.";
        },
      });
  }
}
