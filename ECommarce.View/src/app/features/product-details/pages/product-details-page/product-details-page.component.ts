import { Component, inject, PLATFORM_ID, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { HttpContext } from "@angular/common/http";
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  of,
  switchMap,
  tap,
  shareReplay,
  startWith,
} from "rxjs";

import { ProductService } from "../../../../core/services/product.service";
import { Product, ProductImage } from "../../../../core/models/product";
import { Review } from "../../../../core/models/review";
import { ReviewService } from "../../../../core/services/review.service";
import { CartService } from "../../../../core/services/cart.service";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { NotificationService } from "../../../../core/services/notification.service";
import { AnalyticsService } from "../../../../core/services/analytics.service";
import { SiteSettingsService } from "../../../../core/services/site-settings.service";
import { SHOW_LOADING } from "../../../../core/services/loading.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { SafeHtmlPipe } from "../../../../shared/pipes/safe-html.pipe";

@Component({
  selector: "app-product-details-page",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    PriceDisplayComponent,
    ProductCardComponent,
    AppIconComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./product-details-page.component.html",
  styleUrl: "./product-details-page.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailsPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  public readonly imageUrlService = inject(ImageUrlService);
  private readonly cartService = inject(CartService);
  private readonly notificationService = inject(NotificationService);
  private readonly reviewService = inject(ReviewService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly analytics = inject(AnalyticsService);
  private readonly settingsService = inject(SiteSettingsService);
  private readonly platformId = inject(PLATFORM_ID);
  readonly settings$ = this.settingsService.getSettings();

  currentImageIndex = 0;


  private readonly quantitySubject = new BehaviorSubject<number>(1);
  readonly quantity$ = this.quantitySubject.asObservable();
  private readonly selectedMediaSubject = new BehaviorSubject<string | null>(
    null,
  );

  product$ = this.route.paramMap.pipe(
    map((params) => params.get("slug") ?? ""),
    filter((slug) => slug.length > 0),
    switchMap((slug) =>
      this.productService.getBySlug(
        slug,
        new HttpContext().set(SHOW_LOADING, true),
      ),
    ),
    filter((product): product is Product => Boolean(product)),
    tap((product) => {
      this.quantitySubject.next(1);
      this.selectedMediaSubject.next(null);
      this.currentImageIndex = 0;
      this.analytics.trackViewContent(product);
    }),
    shareReplay(1),
  );

  reviews$ = this.product$.pipe(
    switchMap((product) =>
      this.productService.getReviewsByProductId(product.id),
    ),
  );

  relatedProducts$ = this.product$.pipe(
    switchMap((product) => {
      if (product.categoryId) {
        return this.productService
          .getRelatedProducts(undefined, product.categoryId, 4)
          .pipe(map((res) => res.data));
      }
      return of([]);
    }),
    startWith([] as Product[]),
  );

  readonly vm$ = combineLatest([
    this.product$,
    this.quantitySubject,
    this.selectedMediaSubject,
    this.relatedProducts$,
  ]).pipe(
    map(
      ([
        product,
        quantity,
        selectedMedia,
        relatedProducts,
      ]) => {
        const currentPrice = product.price;
        const currentCompareAtPrice = product.compareAtPrice;

        return {
          product,
          quantity,
          currentStock: 99, // Simplified model has no inventory tracking
          currentPrice,
          currentCompareAtPrice,
          selectedMedia: this.ensureSelectedMedia(product, selectedMedia),
          gallery: this.buildGallery(product),
          relatedProducts,
        };
      },
    ),
  );

  selectionError = "";

  fullStars(rating: number): number[] {
    return Array.from({ length: Math.floor(rating) }, (_, index) => index);
  }

  hasHalfStar(rating: number): boolean {
    return rating % 1 >= 0.5;
  }

  emptyStars(rating: number): number[] {
    const full = Math.floor(rating);
    const half = this.hasHalfStar(rating) ? 1 : 0;
    return Array.from(
      { length: Math.max(0, 5 - full - half) },
      (_, index) => index,
    );
  }

  hasDiscount(product: Product): boolean {
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
    if (!product.compareAtPrice || product.compareAtPrice <= product.price)
      return 0;
    const discount = product.compareAtPrice - product.price;
    return Math.round((discount / product.compareAtPrice) * 100);
  }



  selectMedia(mediaUrl: string): void {
    this.selectedMediaSubject.next(mediaUrl);
  }

  increaseQuantity(): void {
    this.quantitySubject.next(this.quantitySubject.getValue() + 1);
  }

  decreaseQuantity(): void {
    this.quantitySubject.next(Math.max(1, this.quantitySubject.getValue() - 1));
  }

  addToCart(product: Product | null): void {
    if (!product) {
      return;
    }
    const quantity = this.quantitySubject.getValue();

    this.cartService
      .addItem(
        product,
        quantity,
      )
      .subscribe();

    // Show success notification
    this.notificationService.success(
      `Added ${quantity} x ${product.headline} to your bag`,
    );

    this.selectionError = "";
  }

  buyNow(product: Product | null): void {
    this.addToCart(product);
    if (!this.selectionError) {
      void this.router.navigateByUrl("/checkout");
    }
  }

  getWhatsAppUrl(product: Product, whatsAppNumber: string | undefined): string {
    const phone = (whatsAppNumber || "").replace(/[^0-9]/g, "");
    const message = encodeURIComponent(
      `Hi, I'm interested in "${product.headline}".\nPrice: ৳${product.price}\nPlease share more details.`,
    );
    return `https://wa.me/${phone}?text=${message}`;
  }

  trackReview(_: number, review: Review): number {
    return review.id;
  }

  scrollToReviews(): void {
    if (isPlatformBrowser(this.platformId)) {
      const reviewsSection = document.getElementById("reviews");
      if (reviewsSection) {
        reviewsSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  }



  prevImage(gallery: string[]): void {
    this.currentImageIndex =
      (this.currentImageIndex - 1 + gallery.length) % gallery.length;
  }

  nextImage(gallery: string[]): void {
    this.currentImageIndex = (this.currentImageIndex + 1) % gallery.length;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }

  private buildGallery(product: Product): string[] {
    const primaryImg = product.images?.find(i => i.isPrimary)?.imageUrl || product.imgUrl;
    const allImages = product.images?.map((i) => i.imageUrl) ?? [];
    
    let gallery: string[] = [];
    if (primaryImg) {
      gallery.push(primaryImg);
    }
    
    // Add other images, avoiding duplicates
    allImages.forEach((img) => {
      if (img !== primaryImg) {
        gallery.push(img);
      }
    });
    
    return gallery;
  }

  private ensureSelectedMedia(
    product: Product,
    selectedMedia: string | null,
  ): string | null {
    const primaryImg = product.images?.find(i => i.isPrimary)?.imageUrl || product.imgUrl;
    return selectedMedia ?? primaryImg ?? null;
  }
  // Review Logic
  isReviewFormOpen = false;
  reviewRating = 5;
  reviewComment = "";
  reviewName = "";
  reviewError = "";
  isSubmittingReview = false;

  toggleReviewForm(): void {
    this.isReviewFormOpen = !this.isReviewFormOpen;
    if (!this.isReviewFormOpen) {
      this.reviewError = "";
    }
  }

  setRating(rating: number): void {
    this.reviewRating = rating;
  }

  submitReview(productId: number): void {
    if (!this.reviewName.trim() || !this.reviewComment.trim()) {
      this.reviewError = "Please provide your name and a comment.";
      return;
    }

    this.isSubmittingReview = true;
    this.reviewError = "";

    const review: any = {
      productId,
      customerName: this.reviewName,
      rating: this.reviewRating,
      comment: this.reviewComment,
    };

    this.reviewService.addReview(productId, review).subscribe({
      next: (newReview: Review) => {
        this.isSubmittingReview = false;
        this.isReviewFormOpen = false;
        this.reviewComment = "";
        this.reviewName = "";
        this.reviewRating = 5;

        // Refresh reviews
        if (isPlatformBrowser(this.platformId)) {
          window.location.reload();
        }
      },
      error: (err: unknown) => {
        this.isSubmittingReview = false;
        this.reviewError = "Failed to submit review. Please try again.";
        console.error(err);
      },
    });
  }
}
