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
  startWith,
  shareReplay,
  take,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CartItem } from "../../../../core/models/cart";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AuthService } from "../../../../core/services/auth.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import {
  DeliveryMethod,
  AdminSettings,
} from "../../../../admin/models/settings.models";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";

import {
  LucideAngularModule,
  CheckCircle2,
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Truck,
  Info,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-angular";

@Component({
  selector: "app-checkout-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    PriceDisplayComponent,
    LucideAngularModule,
  ],
  templateUrl: "./checkout-page.component.html",
  styleUrl: "./checkout-page.component.css",
})
export class CheckoutPageComponent {
  readonly icons = {
    CheckCircle2,
    ArrowLeft,
    User,
    Phone,
    MapPin,
    Truck,
    Info,
    Search,
    ChevronDown,
    ChevronUp,
  };
  private readonly cartService = inject(CartService);
  private readonly checkoutService = inject(CheckoutService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly customerOrderApi = inject(CustomerOrderApiService);
  readonly imageUrlService = inject(ImageUrlService);
  private readonly analyticsService = inject(AnalyticsService);

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    city: ["", Validators.required],
    area: ["", Validators.required],
    deliveryMethodId: [0, Validators.required],
    paymentMethod: ["cod", Validators.required],
  });

  cities = Object.keys(BANGLADESH_LOCATIONS).sort();
  filteredCities: string[] = [];
  citySearch = "";
  isCityDropdownOpen = false;

  areas: string[] = [];
  filteredAreas: string[] = [];
  areaSearch = "";
  isAreaDropdownOpen = false;

  isLoading = false;
  errorMessage = "";
  didAutofill = false;
  selectedMethod: DeliveryMethod | null = null;

  private readonly settingsService = inject(SettingsService);

  readonly deliveryMethods$ = this.settingsService
    .getPublicDeliveryMethods()
    .pipe(
      tap((methods) => {
        if (methods.length > 0) {
          const defaultMethod =
            methods.find((m) => m.name.toLowerCase().includes("inside")) ||
            methods[0];
          const currentId = this.checkoutForm.controls.deliveryMethodId.value;
          if (!currentId) {
            this.checkoutForm.patchValue({
              deliveryMethodId: defaultMethod.id,
            });
          }
        }
      }),
      shareReplay(1),
      catchError((err) => {
        console.error("Failed to load delivery methods", err);
        return of([] as DeliveryMethod[]);
      }),
    );

  readonly summary$ = this.cartService.summary$;

  readonly vm$ = combineLatest([
    this.cartService.getCart(),
    this.summary$,
    this.settingsService
      .getSettings()
      .pipe(startWith(null as AdminSettings | null)),
    this.deliveryMethods$.pipe(startWith([] as DeliveryMethod[])),
    this.checkoutForm.controls.deliveryMethodId.valueChanges.pipe(
      startWith(this.checkoutForm.controls.deliveryMethodId.value),
    ),
  ]).pipe(
    map(([cartItems, summary, settings, deliveryMethods, currentMethodId]) => {
      // Fallback to settings.deliveryMethods if public call is empty but settings has them
      const rawMethods = (deliveryMethods && deliveryMethods.length > 0) 
        ? deliveryMethods 
        : (settings?.deliveryMethods || []);
      
      const activeMethods = rawMethods.filter(m => m.isActive);

      const freeShippingThreshold = settings?.freeShippingThreshold ?? 0;
      const isFreeShipping =
        freeShippingThreshold > 0 && summary.subtotal >= freeShippingThreshold;

      // Update delivery methods costs if free shipping applies
      const effectiveDeliveryMethods = activeMethods.map((m) => ({
        ...m,
        cost: isFreeShipping ? 0 : m.cost,
      }));

      // Find the currently selected method in the effective list (to get the updated cost)
      const selectedMethod =
        effectiveDeliveryMethods.find((m) => m.id === currentMethodId) || null;

      const shipping = selectedMethod ? selectedMethod.cost : summary.shipping;
      const total = summary.subtotal + summary.tax + shipping;

      return {
        cartItems,
        summary: { ...summary, shipping, total },
        deliveryMethods: effectiveDeliveryMethods,
        isFreeShipping,
      };
    }),
    tap(({ cartItems, summary }) => {
      this.analyticsService.trackInitiateCheckout(cartItems, summary.total);
    }),
    shareReplay(1),
  );

  constructor() {
    this.checkoutService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((state) => {
        this.checkoutForm.patchValue({
          fullName: state.fullName,
          phone: state.phone,
          address: state.address,
        });
      });

    this.checkoutForm.controls.city.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((city) => {
        this.areas = BANGLADESH_LOCATIONS[city] || [];
        this.filteredAreas = [...this.areas];
        this.checkoutForm.patchValue({ area: "" });
        this.areaSearch = "";
        this.citySearch = city; // Keep search input synced
        // Logic moved to a more robust listener
      });

    // Unified listener for city/address changes to update delivery method
    combineLatest([
      this.checkoutForm.controls.city.valueChanges.pipe(startWith(this.checkoutForm.controls.city.value)),
      this.deliveryMethods$
    ])
    .pipe(
      debounceTime(100),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(([city, methods]) => {
      this.applyDeliveryMethodLogic(city as string, methods as DeliveryMethod[]);
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

    this.checkoutForm.controls.address.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((address) => {
        if (!address) return;
        const addrLower = address.toLowerCase();
        const currentCity = this.checkoutForm.controls.city.value.toLowerCase();
        
        // If address contains "dhaka" but city is not dhaka, and user hasn't explicitly picked another city
        if (addrLower.includes("dhaka") && currentCity !== "dhaka") {
          // Only auto-switch if city is empty or not yet set to a specific one
          if (!currentCity) {
            this.selectCity("Dhaka");
          }
        }
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

          if (!this.authService.isLoggedIn()) {
            const phone = this.checkoutForm.controls.phone.value;
            this.authService.customerPhoneLogin(phone).subscribe({
              next: () =>
                void this.router.navigate(["/order-confirmation", orderId]),
              error: () =>
                void this.router.navigate(["/order-confirmation", orderId]),
            });
          } else {
            void this.router.navigate(["/order-confirmation", orderId]);
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message ?? error.message ?? "Unable to place order.";
        },
      });
  }

  private applyDeliveryMethodLogic(city: string, methods: DeliveryMethod[]): void {
    if (!methods || !methods.length || !city) return;
    const active = methods.filter((m) => m.isActive);
    if (!active.length) return;

    const cityLower = city.toLowerCase().trim();
    const isDhaka = cityLower === "dhaka";

    const inside = active.filter((m) => m.name.toLowerCase().includes("inside") || m.name.toLowerCase().includes("dhaka"));
    const outside = active.filter((m) => m.name.toLowerCase().includes("outside"));
    let method: DeliveryMethod | undefined;
    if (isDhaka) {
      method = inside.length ? inside[0] : outside.length ? outside[0] : active[0];
    } else {
      method = outside.length ? outside[0] : inside.length ? inside[0] : active[0];
    }

    if (method) {
      this.checkoutForm.patchValue({ deliveryMethodId: Number(method.id) }, { emitEvent: false });
      this.selectedMethod = method;
    }
  }

  private updateDeliveryMethodByCity(city: string): void {
    this.deliveryMethods$.pipe(take(1)).subscribe((methods) => {
      this.applyDeliveryMethodLogic(city, methods);
    });
  }

  filterCities(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.citySearch = query;
    this.filteredCities = this.cities.filter(c => c.toLowerCase().includes(query));
  }

  selectCity(city: string): void {
    this.checkoutForm.patchValue({ city });
    this.citySearch = city;
    this.isCityDropdownOpen = false;
  }

  toggleCityDropdown(): void {
    this.isCityDropdownOpen = !this.isCityDropdownOpen;
    if (this.isCityDropdownOpen) {
      this.isAreaDropdownOpen = false; // Close other
      this.filteredCities = [...this.cities];
      this.citySearch = this.checkoutForm.get('city')?.value || "";
    }
  }

  filterAreas(event: Event): void {
    const query = (event.target as HTMLInputElement).value.toLowerCase();
    this.areaSearch = query;
    this.filteredAreas = this.areas.filter(a => a.toLowerCase().includes(query));
  }

  selectArea(area: string): void {
    this.checkoutForm.patchValue({ area });
    this.areaSearch = area;
    this.isAreaDropdownOpen = false;
  }

  toggleAreaDropdown(): void {
    if (!this.checkoutForm.get('city')?.value) return;
    this.isAreaDropdownOpen = !this.isAreaDropdownOpen;
    if (this.isAreaDropdownOpen) {
      this.isCityDropdownOpen = false; // Close other
      this.filteredAreas = [...this.areas];
      this.areaSearch = this.checkoutForm.get('area')?.value || "";
    }
  }

  trackCartItem(_: number, item: CartItem): string {
    return item.id;
  }

  private persistCheckoutState(): void {
    this.checkoutService.updateState({
      fullName: this.checkoutForm.controls.fullName.value ?? "",
      phone: this.checkoutForm.controls.phone.value ?? "",
      address: this.checkoutForm.controls.address.value ?? "",
      city: this.checkoutForm.controls.city.value ?? "",
      area: this.checkoutForm.controls.area.value ?? "",
      deliveryMethodId:
        this.checkoutForm.controls.deliveryMethodId.value ?? undefined,
    });
  }
}
