import { Component, DestroyRef, OnInit, inject, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
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
  Phone,
  MessageSquare,
  Star,
  ChevronDown,
} from "lucide-angular";
import { BANGLADESH_LOCATIONS } from "../../../../core/utils/bangladesh-locations";
import { CheckoutState } from "../../../../core/models/checkout";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { CartService } from "../../../../core/services/cart.service";
import { CheckoutService } from "../../../../core/services/checkout.service";
import { CustomerOrderApiService } from "../../../../core/services/customer-order-api.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { SettingsService } from "../../../../admin/services/settings.service";
import { DeliveryMethod } from "../../../../admin/models/settings.models";
import { LandingPageService, PublicLandingPage } from "../../services/landing-page.service";
import { PublicReviewService, PublicReview } from "../../services/public-review.service";
import { SiteSettingsService, SiteSettings } from "../../../../core/services/site-settings.service";

interface OfferItem {
  id: string | number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

@Component({
  selector: "app-landing-page",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
    Phone,
    MessageSquare,
    Star,
    ChevronDown,
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
  private readonly landingPageService = inject(LandingPageService);
  private readonly publicReviewService = inject(PublicReviewService);
  private readonly siteSettingsService = inject(SiteSettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly imageUrlService = inject(ImageUrlService);

  product: Product | null = null;
  landingPage: PublicLandingPage | null = null;
  isLoading = false;
  isOrdering = false;
  errorMessage = "";
  didAutofill = false;
  deliveryMethods: DeliveryMethod[] = [];
  selectedMethod: DeliveryMethod | null = null;
  siteSettings: SiteSettings | null = null;
  reviews: PublicReview[] = [];
  currentReviewIndex = 0;

  offerItems: OfferItem[] = [
    { id: 'bb', name: 'Blueberry Gel -100ml', price: 160, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/Blueberry-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'mc', name: 'Soft Silicon Magic Con*dom', price: 400, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/Magic-Condom-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'gg', name: 'Grape Gel -100ml', price: 160, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/Grape-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'sg', name: 'Strawberry Gel -100ml', price: 160, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/Strawberry-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'sg2', name: 'Strawberry, Grape – 2 Flavor Combo', price: 240, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/2-pices-Combo-SG-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'sb2', name: 'Strawberry, blueberry – 2 Flavor Combo', price: 240, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/2-pis-Combo-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'smc', name: 'Strawberry & Magic Con*dom Combo', price: 450, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/City-Condom-Pack12-1-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'sbg3', name: 'Strawberry, blueberry & grape – 3 Flavor Combo', price: 300, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/3-Pis-Combo-800x800-1-300x300-1.jpg', quantity: 0 },
    { id: 'sgmc', name: 'Strawberry, Grape – Magic Con*dom Combo', price: 480, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/02/2-pis-Magic-Combo.png-800x800-1-300x300-1-1.jpg', quantity: 0 },
    { id: 'sbgmc', name: 'Strawberry, Blueberry, Grape –Con*dom Combo', price: 530, imageUrl: 'https://lovecarebd.online/wp-content/uploads/2026/03/TONO-HIME-Strawberry-Blueberry-Grape-–-Magic-Condom-Combo-300x300-1.webp', quantity: 1 },
  ];

  districts = Object.keys(BANGLADESH_LOCATIONS).sort();
  availableAreas: string[] = [];

  readonly checkoutForm = this.formBuilder.nonNullable.group({
    fullName: ["", [Validators.required, Validators.minLength(2)]],
    phone: ["", [Validators.required, Validators.minLength(7)]],
    district: ["Dhaka", [Validators.required]],
    area: ["", [Validators.required]],
    address: ["", [Validators.required, Validators.minLength(5)]],
    deliveryDetails: ["Standard Delivery", [Validators.required]],
    deliveryMethodId: [0, Validators.required],
    selectedColor: [""],
    selectedSize: [""],
    quantity: [1, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    // Start fetching global settings in parallel immediately
    this.settingsService.getPublicDeliveryMethods().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(methods => {
      this.deliveryMethods = methods;
      if (methods.length > 0 && !this.checkoutForm.controls.deliveryMethodId.value) {
        const defaultMethod = methods.find((m) => m.name.toLowerCase().includes("inside")) || methods[0];
        this.checkoutForm.patchValue({ deliveryMethodId: defaultMethod.id });
        this.selectedMethod = defaultMethod;
      }
      this.cdr.markForCheck();
    });

    this.settingsService.getPublicSettings().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of(null))
    ).subscribe(settings => {
      this.siteSettings = settings;
      this.cdr.markForCheck();
    });

    this.siteSettingsService.getSettings().pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(() => of(null))
    ).subscribe(settings => {
      this.siteSettings = {
        ...(this.siteSettings || {}),
        ...(settings || {}),
      } as SiteSettings | null;
      this.cdr.markForCheck();
    });

    this.loadProductAndSettings();
    this.setupFormWatchers();
    
    // Initial area load for default district
    this.updateAreas("Dhaka");
  }

  private updateAreas(district: string): void {
    this.availableAreas = BANGLADESH_LOCATIONS[district] || [];
    this.cdr.markForCheck();
  }

  private loadProductAndSettings(): void {
    this.isLoading = true;

    this.route.paramMap.pipe(
      map((params) => params.get("slug") ?? ""),
      filter((slug) => slug.length > 0),
      distinctUntilChanged(),
      switchMap((slug) =>
        combineLatest([
          this.productService.getBySlug(slug).pipe(catchError(() => of(null))),
          this.landingPageService.getLandingPage(slug).pipe(catchError(() => of(null)))
        ])
      ),
      switchMap(([product, landingPage]) => {
        if (!product) {
          this.isLoading = false;
          this.errorMessage = "Product not found.";
          this.cdr.markForCheck();
          return of(null);
        }

        this.product = product;
        this.landingPage = landingPage;

        // Load reviews in parallel with product-dependent items
        const reviews$ = this.publicReviewService.getReviewsByProduct(product.id).pipe(
          catchError(() => of([] as PublicReview[]))
        );

        // Fetch offer items if it's an item product
        const items$ = product.isItemProduct
          ? this.productService.getItemProducts().pipe(
            map(p => p.data),
            catchError(() => of([]))
          )
          : of([]);

        return combineLatest([reviews$, items$]).pipe(
          tap(([reviews, items]) => {
            this.processReviews(product, landingPage, reviews);

            if (product.isItemProduct) {
              this.offerItems = items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                imageUrl: this.imageUrlService.getImageUrl(item.imageUrl || ''),
                quantity: item.id === product.id ? 1 : 0
              }));

              // Ensure current product is first
              const currentIndex = this.offerItems.findIndex(i => i.id === product.id);
              if (currentIndex > 0) {
                const [current] = this.offerItems.splice(currentIndex, 1);
                this.offerItems.unshift(current);
              } else if (currentIndex === -1) {
                this.offerItems.unshift({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: this.imageUrlService.getImageUrl(product.imageUrl || ''),
                  quantity: 1
                });
              }
            }

            // Set default variants
            const colors = Array.from(new Set(product.images?.map(i => i.color).filter(Boolean))) as string[];
            const sizes = Array.from(new Set(product.variants?.map(v => v.size).filter(Boolean))) as string[];
            this.checkoutForm.patchValue({
              selectedColor: colors[0] ?? "",
              selectedSize: sizes[0] ?? "",
            });

            this.isLoading = false;
            this.cdr.markForCheck();
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private processReviews(product: Product, landingPage: PublicLandingPage | null, reviews: PublicReview[] | null | undefined): void {
    const normalizedReviews = Array.isArray(reviews) ? reviews : [];
    let allReviews = [...normalizedReviews];

    // Add static reviews from landing page config if any
    if (landingPage?.reviewsImages) {
      try {
        const staticImages = JSON.parse(landingPage.reviewsImages);
        if (Array.isArray(staticImages)) {
          const staticReviews: PublicReview[] = staticImages.map((url, index) => ({
            id: -(index + 1),
            productId: product.id,
            productName: product.name || "",
            customerName: "Customer Review",
            customerAvatar: undefined,
            rating: 5,
            comment: "", // No text for static image reviews usually
            date: new Date().toISOString(),
            isVerifiedPurchase: true,
            reviewImage: url,
            likes: 0
          }));
          allReviews = [...staticReviews, ...allReviews];
        }
      } catch (e) {
        console.error("Error parsing static reviews", e);
      }
    }

    this.reviews = allReviews;
    this.currentReviewIndex = 0; // Reset index to first slide
    this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        }
      });

    this.checkoutForm.controls.deliveryMethodId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.selectedMethod =
          this.deliveryMethods.find((m) => m.id === id) || null;
        this.cdr.markForCheck();
      });

    this.checkoutForm.controls.district.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((district) => {
        this.updateAreas(district);
        this.checkoutForm.patchValue({ area: "" });
        this.updateDeliveryMethodByDistrict(district);
      });
  }

  private updateDeliveryMethodByDistrict(district: string): void {
    const isDhaka = district.toLowerCase() === "dhaka";
    const method = this.deliveryMethods.find((m) =>
      isDhaka
        ? m.name.toLowerCase().includes("inside")
        : m.name.toLowerCase().includes("outside"),
    );
    if (method) {
      this.checkoutForm.patchValue({ deliveryMethodId: method.id });
      this.selectedMethod = method;
    }
  }

  get subtotal(): number {
    return this.offerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  get total(): number {
    const shipping = this.selectedMethod?.cost ?? 0;
    return this.subtotal > 0 ? this.subtotal + shipping : 0;
  }

  // UI Helpers matching ProductDetailsPageComponent
  currentImageIndex = 0;

  get gallery(): string[] {
    if (!this.product) return [];
    const images = this.product.images?.map((i) => i.imageUrl) ?? [];
    let gallery = [];
    if (this.product.imageUrl) {
      gallery.push(this.product.imageUrl);
    }
    images.forEach((img) => {
      if (img !== this.product?.imageUrl) {
        gallery.push(img);
      }
    });
    return gallery;
  }

  get uniqueColors(): { name: string; hex: string }[] {
    if (!this.product) return [];
    return Array.from(
      new Set(this.product.images?.map((i) => i.color).filter(Boolean)),
    ).map((color) => ({ name: color!, hex: "" }));
  }

  prevImage(): void {
    const len = this.gallery.length;
    if (len === 0) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + len) % len;
  }

  nextImage(): void {
    const len = this.gallery.length;
    if (len === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % len;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  // Review Slider Logic
  prevReview(): void {
    const len = this.reviews.length;
    if (len === 0) return;
    this.currentReviewIndex = (this.currentReviewIndex - 1 + len) % len;
    this.cdr.markForCheck();
  }

  nextReview(): void {
    const len = this.reviews.length;
    if (len === 0) return;
    this.currentReviewIndex = (this.currentReviewIndex + 1) % len;
    this.cdr.markForCheck();
  }

  goToReview(index: number): void {
    this.currentReviewIndex = index;
    this.cdr.markForCheck();
  }

  hasDiscount(product: Product): boolean {
    return !!(
      product.compareAtPrice &&
      product.compareAtPrice > 0 &&
      product.compareAtPrice > product.price
    );
  }

  getDiscountPercentage(product: Product): number {
    if (!this.hasDiscount(product)) return 0;
    const discount = (product.compareAtPrice ?? 0) - product.price;
    return Math.round((discount / (product.compareAtPrice ?? 1)) * 100);
  }

  getColorImage(color: string): string | null {
    if (!this.product?.images) return null;
    const img = this.product.images.find((i) => i.color === color);
    return img ? this.imageUrlService.getImageUrl(img.imageUrl) : null;
  }

  selectColor(colorName: string): void {
    this.checkoutForm.patchValue({ selectedColor: colorName });

    // Switch image
    const colorImage = this.product?.images.find((i) => i.color === colorName);
    if (colorImage) {
      const index = this.gallery.findIndex(
        (url) => url === colorImage.imageUrl,
      );
      if (index !== -1) this.currentImageIndex = index;
    }
  }

  changeQty(item: any, delta: number): void {
    item.quantity = Math.max(0, item.quantity + delta);
    this.cdr.markForCheck();
  }

  updateQuantity(item: any, event: any): void {
    const val = parseInt(event.target.value) || 0;
    item.quantity = Math.max(0, val);
    this.cdr.markForCheck();
  }

  increaseQuantity(): void {
    const current = this.checkoutForm.controls.quantity.value;
    this.checkoutForm.patchValue({ quantity: current + 1 });
  }

  decreaseQuantity(): void {
    const current = this.checkoutForm.controls.quantity.value;
    if (current > 1) {
      this.checkoutForm.patchValue({ quantity: current - 1 });
    }
  }

  placeOrder(): void {
    if (this.isOrdering || !this.product) return;
    this.errorMessage = "";

    // Manual validation check for required variants
    const colors = Array.from(
      new Set(this.product.images?.map((i) => i.color).filter(Boolean)),
    );
    const sizes = Array.from(
      new Set(this.product.variants?.map((v) => v.size).filter(Boolean)),
    );

    const isColorRequired = colors.length > 0;
    const isSizeRequired = sizes.length > 0;

    const formRaw = this.checkoutForm.getRawValue();

    if (
      this.checkoutForm.invalid ||
      (isColorRequired && !formRaw.selectedColor) ||
      (isSizeRequired && !formRaw.selectedSize)
    ) {
      if (isColorRequired && !formRaw.selectedColor) {
        this.errorMessage = "Please select a color.";
      } else if (isSizeRequired && !formRaw.selectedSize) {
        this.errorMessage = "Please select a size.";
      }
      this.checkoutForm.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.isOrdering = true;
    this.errorMessage = "";
    this.cdr.markForCheck();

    // For landing page, we bypass the normal cart and create a "virtual" cart with items from offerItems
    this.cartService.clearCart();

    const selectedItems = this.offerItems.filter(i => i.quantity > 0);
    if (selectedItems.length === 0) {
      this.errorMessage = "Please select at least one product.";
      this.cdr.markForCheck();
      return;
    }

    const form = this.checkoutForm.getRawValue();

    // Add selected items to cart
    try {
      selectedItems.forEach(item => {
        const dummyProduct: any = {
          id: typeof item.id === 'string' ? 99999 : item.id,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          status: 'Active',
          variants: [],
          images: []
        };
        this.cartService.addItem(dummyProduct, item.quantity);
      });
    } catch (err) {
      console.error("Error adding items to cart:", err);
      this.isOrdering = false;
      this.errorMessage = "An error occurred while preparing your order. Please try again.";
      this.cdr.markForCheck();
      return;
    }

    // 2. Persist state to checkout service
    this.checkoutService.updateState({
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
      city: form.district,
      area: form.area,
      deliveryDetails: form.deliveryDetails,
      deliveryMethodId: form.deliveryMethodId,
    });

    // 3. Place order
    this.checkoutService.createOrder().subscribe({
      next: (orderId) => {
        this.isOrdering = false;
        this.cdr.markForCheck();
        if (orderId) {
          void this.router.navigate(["/order-confirmation", orderId]);
        }
      },
      error: (error: Error) => {
        this.isOrdering = false;
        this.errorMessage = error.message ?? "Unable to place order.";
        this.cdr.markForCheck();
      },
    });
  }

  scrollToOrderForm(): void {
    const el = document.getElementById("order-form-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });

      setTimeout(() => {
        const nameInput = document.querySelector('input[formControlName="fullName"]') as HTMLElement;
        if (nameInput) nameInput.focus();
      }, 500);
    }
  }

  useFallback(event: Event): void {
    if (this.product && this.product.imageUrl) {
      const target = event.target as HTMLImageElement;
      target.src = this.imageUrlService.getImageUrl(this.product.imageUrl);
    }
  }
}
