import { Component, DestroyRef, OnInit, inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
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
  startWith,
} from "rxjs";
import {
  LucideAngularModule,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Truck,
  Lock,
  ArrowRight,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  Maximize2,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  X,
  AlertTriangle,
} from "lucide-angular";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { CartService } from "../../../../core/services/cart.service";
import { OrderService } from "../../../../core/services/order.service";
import { CartItem, CartSummary } from "../../../../core/models/cart";
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
    LucideAngularModule,
  ],
  templateUrl: "./landing-page.component.html",
  styleUrl: "./landing-page.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit {
  readonly icons = {
    Loader2,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Truck,
    Lock,
    ArrowRight,
    Plus,
    Minus,
    ShoppingCart,
    User,
    Search,
    ChevronDown,
    ChevronUp,
    Star,
    Maximize2,
    ShieldCheck,
    ShoppingBag,
    CreditCard,
    MessageSquare,
    X,
    AlertTriangle,
  };
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
  private readonly orderService = inject(OrderService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly cdr = inject(ChangeDetectorRef);

  product: Product | null = null;
  siteSettings: any = null;
  isLoading = false;
  isOrdering = false;
  errorMessage = "";
  date = new Date();
  
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;

  reviews: any[] = [
    {
      customerName: "Rahim Ahmed",
      comment: "অসাধারণ প্রোডাক্ট! আমি অনেকদিন ধরে এমন কিছু খুঁজছিলাম। প্যাকেজিং খুবই ডিসক্রিট ছিল।",
      reviewImage: null
    },
    {
      customerName: "Karim Uddin",
      comment: "খুবই দ্রুত ডেলিভারি পেয়েছি। প্রোডাক্টের মান অনেক ভালো। ধন্যবাদ অর্জামার্টকে।",
      reviewImage: null
    },
    {
      customerName: "Siddique Ullah",
      comment: "প্রথমে একটু দ্বিধায় ছিলাম, কিন্তু ব্যবহারের পর বুঝলাম এটা আসলেই কার্যকরী।",
      reviewImage: null
    }
  ];
  currentReviewIndex = 0;

  offerItems: any[] = [];
  
  isModalOpen = false;
  selectedPopupItem: any = null;
  modalQuantity = 1;

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    phone: ["", [Validators.required, Validators.minLength(11)]],
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    deliveryZone: ["inside", Validators.required],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryMethodId: [0, Validators.required],
  });

  ngOnInit(): void {
    this.loadProductAndSettings();
    this.setupFormWatchers();
  }

  private loadProductAndSettings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      filter((slug) => slug.length > 0),
      switchMap((slug) => this.productService.getBySlug(slug).pipe(
        catchError((err) => {
          console.error('Product fetch error:', err);
          this.errorMessage = 'Product not found or server error.';
          this.isLoading = false;
          this.cdr.markForCheck();
          return of(null);
        })
      )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((product) => {
      this.product = product;
      this.isLoading = false;
      this.cdr.markForCheck();

      if (product) {
        this.settingsService.getPublicDeliveryMethods().pipe(
          catchError(() => of([]))
        ).subscribe((methods) => {
          this.deliveryMethods = methods;
          if (methods && methods.length > 0) {
            const active = methods.filter((m) => m.isActive);
            if (active.length > 0) {
              const defaultMethod =
                active.find((m) => m.name.toLowerCase().includes('inside')) || active[0];
              this.checkoutForm.patchValue({ deliveryMethodId: defaultMethod.id });
              this.selectedMethod = defaultMethod;
            }
          }
          this.cdr.markForCheck();
        });

        this.productService.getProducts({}).pipe(
          map((res) => res.data || []),
          catchError(() => of([]))
        ).subscribe((allProducts) => {
          this.offerItems = allProducts.map((p) => ({
            ...p,
            name: p.headline,
            imageUrl: this.imageUrlService.getImageUrl(p.imgUrl),
            quantity: p.id === product.id ? 1 : 0,
          }));
          if (!this.offerItems.find((i) => i.id === product.id)) {
            this.offerItems.unshift({
              ...product,
              name: product.headline,
              imageUrl: this.imageUrlService.getImageUrl(product.imgUrl),
              quantity: 1,
            });
          }
          this.cdr.markForCheck();
        });

        this.settingsService.getSettings().pipe(
          catchError(() => of(null))
        ).subscribe((settings) => {
          this.siteSettings = settings;
          this.cdr.markForCheck();
        });
      }
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
          const isDhaka = (customer.city || "Dhaka").toLowerCase() === "dhaka";
          this.checkoutForm.patchValue(
            {
              fullName: customer.name,
              address: customer.address,
              deliveryZone: isDhaka ? "inside" : "outside"
            },
            { emitEvent: true },
          );
        }
      });

    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
      });

    // Delivery Zone Listener
    this.checkoutForm.controls.deliveryZone.valueChanges
      .pipe(
        startWith(this.checkoutForm.controls.deliveryZone.value),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((zone) => {
        this.applyDeliveryMethodLogic(zone);
      });

  }

  private applyDeliveryMethodLogic(zone: string): void {
    const methods = this.deliveryMethods;
    if (!methods || !methods.length) return;
    
    const active = methods.filter((m) => m.isActive);
    if (!active.length) return;

    const isInside = zone === "inside";

    const insideMethods = active.filter((m) => 
      m.name.toLowerCase().includes("inside") || 
      m.name.toLowerCase().includes("dhaka")
    );
    const outsideMethods = active.filter((m) => 
      m.name.toLowerCase().includes("outside")
    );

    let method: DeliveryMethod | undefined;
    if (isInside) {
      method = insideMethods.length ? insideMethods[0] : outsideMethods[0];
    } else {
      method = outsideMethods.length ? outsideMethods[0] : insideMethods[0];
    }

    if (!method && active.length > 0) {
      method = active[0];
    }

    if (method) {
      this.checkoutForm.patchValue({ deliveryMethodId: method.id }, { emitEvent: false });
      this.selectedMethod = method;
      this.cdr.markForCheck();
    }
  }

  private updateDeliveryMethodByCity(city: string): void {
    if (!this.deliveryMethods || !this.deliveryMethods.length) return;
    const zone = city.toLowerCase() === "dhaka" ? "inside" : "outside";
    this.applyDeliveryMethodLogic(zone);
  }

  scrollToOrderForm(): void {
    if (isPlatformBrowser(this.platformId)) {
      const el = document.getElementById("order");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }

  nextReview(): void {
    const jump = 3;
    if (this.currentReviewIndex + jump < this.reviews.length) {
      this.currentReviewIndex += jump;
    } else {
      this.currentReviewIndex = 0;
    }
    this.cdr.markForCheck();
  }

  prevReview(): void {
    const jump = 3;
    if (this.currentReviewIndex - jump >= 0) {
      this.currentReviewIndex -= jump;
    } else {
      // Go to last possible start index
      this.currentReviewIndex = Math.floor((this.reviews.length - 1) / jump) * jump;
    }
    this.cdr.markForCheck();
  }

  goToReview(index: number): void {
    this.currentReviewIndex = index;
    this.cdr.markForCheck();
  }

  get totalPages(): number[] {
    const pagesCount = Math.ceil(this.reviews.length / 3);
    return Array(pagesCount).fill(0).map((_, i) => i * 3);
  }

  changeQty(item: any, delta: number): void {
    const newQty = (item.quantity || 0) + delta;
    item.quantity = Math.max(0, newQty);
  }

  updateQuantity(item: any, event: any): void {
    const val = parseInt(event.target.value, 10);
    item.quantity = isNaN(val) ? 0 : Math.max(0, val);
  }

  openProductModal(item: any): void {
    this.selectedPopupItem = item;
    this.modalQuantity = item.quantity > 0 ? item.quantity : 1;
    this.isModalOpen = true;
  }

  closeProductModal(): void {
    this.isModalOpen = false;
    this.selectedPopupItem = null;
  }

  updateModalQuantity(delta: number): void {
    this.modalQuantity = Math.max(1, this.modalQuantity + delta);
  }

  confirmModalAdd(): void {
    if (this.selectedPopupItem) {
      this.selectedPopupItem.quantity = this.modalQuantity;
      this.closeProductModal();
    }
  }

  get subtotal(): number {
    return this.offerItems.reduce((acc, item) => acc + (item.price * (item.quantity || 0)), 0);
  }

  get total(): number {
    const sub = this.subtotal;
    if (sub === 0) return 0;
    const shipping = this.selectedMethod?.cost ?? 0;
    return sub + shipping;
  }

  hasDiscount(product: { price: number; compareAtPrice?: number }): boolean {
    return !!(
      product.compareAtPrice &&
      product.compareAtPrice > 0 &&
      product.compareAtPrice > product.price
    );
  }

  getDiscountPercentage(product: {
    price: number;
    compareAtPrice?: number;
  }): number {
    if (!this.hasDiscount(product)) return 0;
    const discount = (product.compareAtPrice ?? 0) - product.price;
    return Math.round((discount / (product.compareAtPrice ?? 1)) * 100);
  }

  placeOrder(): void {
    if (this.isOrdering || this.subtotal === 0) return;
    this.errorMessage = "";

    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.isOrdering = true;
    const form = this.checkoutForm.getRawValue();

    const selectedItems = this.offerItems.filter(i => i.quantity > 0);
    const cartItems: any[] = selectedItems.map(item => ({
      id: "landing-" + item.id + "-" + Date.now(),
      productId: item.id,
      name: item.headline,
      price: item.price,
      quantity: item.quantity,
      imageUrl: item.imgUrl,
      imageAlt: item.headline,
      discountPercentage: this.getDiscountPercentage(item),
      compareAtPrice: item.compareAtPrice,
      size: "One Size"
    }));

    const subtotal = this.subtotal;
    const shipping = this.selectedMethod?.cost ?? 0;
    
    const summary: CartSummary = {
      itemsCount: selectedItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: subtotal,
      tax: 0,
      shipping: shipping,
      discount: selectedItems.reduce((acc, i) => acc + ((i.compareAtPrice ? (i.compareAtPrice - i.price) : 0) * i.quantity), 0),
      total: subtotal + shipping,
      freeShippingThreshold: 0,
      freeShippingRemaining: 0,
      freeShippingProgress: 100
    };

    this.orderService.placeOrder({
      state: {
        fullName: form.fullName,
        phone: form.phone,
        address: form.address,
        city: form.deliveryZone === "inside" ? "Dhaka" : "Outside Dhaka",
        area: "N/A",
        deliveryMethodId: form.deliveryMethodId
      },
      cartItems,
      summary,
      deliveryMethodId: form.deliveryMethodId
    })
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: (order) => {
        this.isOrdering = false;
        if (order?.id) {
          void this.router.navigate(["/order-confirmation", order.id]);
        }
      },
      error: (error: Error) => {
        this.isOrdering = false;
        this.errorMessage = error.message ?? "Unable to place order.";
      },
    });
  }
}
