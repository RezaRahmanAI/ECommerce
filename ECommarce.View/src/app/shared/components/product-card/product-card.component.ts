import {
  Component,
  Input,
  OnInit,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from "@angular/core";
import {
  CommonModule,
  isPlatformBrowser,
  NgOptimizedImage,
} from "@angular/common";
import { Router, RouterLink } from "@angular/router";

import {
  Product,
  RelatedProduct,
} from "../../../core/models/product";
import { BadgeComponent } from "../badge/badge.component";
import { IconButtonComponent } from "../icon-button/icon-button.component";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { CartService } from "../../../core/services/cart.service";
import { NotificationService } from "../../../core/services/notification.service";
import { LucideAngularModule, ShoppingCart } from "lucide-angular";
import { QuickAddModalComponent } from "../quick-add-modal/quick-add-modal.component";
import { ProductImage } from "../../../core/models/product";
import { LazyComponentDirective } from "../../directives/lazy-component.directive";
import { PrefetchOnHoverDirective } from "../../directives/prefetch-on-hover.directive";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PriceDisplayComponent,
    LucideAngularModule,
    QuickAddModalComponent,
    NgOptimizedImage,
    LazyComponentDirective,
    PrefetchOnHoverDirective,
  ],
  templateUrl: "./product-card.component.html",
  styleUrl: "./product-card.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: Product | RelatedProduct;

  isLoaded = false;
  readonly icons = { ShoppingCart };

  public readonly imageUrlService = inject(ImageUrlService);
  private readonly cartService = inject(CartService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit() {
  }

  onRendered(): void {
    this.isLoaded = true;
    this.cdr.detectChanges();
  }

  get mainImage(): string | null {
    return (
      this.product.imgUrl ||
      ("images" in this.product && this.product.images.length > 0
        ? this.product.images[0].imageUrl
        : null)
    );
  }

  get fallbackImageUrl(): string {
    return this.product.imgUrl || "";
  }

  get hasDiscount(): boolean {
    const compareAtPrice = this.originalPrice;
    return !!(
      compareAtPrice &&
      compareAtPrice > 0 &&
      compareAtPrice > this.currentPrice
    );
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    const price = this.currentPrice;
    const compareAtPrice = this.originalPrice;
    const discount = (compareAtPrice ?? 0) - price;
    return Math.round((discount / (compareAtPrice || 1)) * 100);
  }

  get originalPrice(): number {
    if ("compareAtPrice" in this.product && this.product.compareAtPrice && this.product.compareAtPrice > 0) {
      return this.product.compareAtPrice;
    }
    return 0;
  }

  get currentPrice(): number {
    if ("price" in this.product && this.product.price > 0) {
      return this.product.price;
    }
    return 0;
  }

  get description(): string {
    return (this.product as Product).subtitle || "";
  }

  addToCart(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if ("id" in this.product) {
      this.cartService
        .addItem(
          this.product as Product,
          1,
        )
        .subscribe();
        
      this.notificationService.success(`Added ${this.product.headline} to your bag`);
    }
  }


  orderNow(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if ("id" in this.product) {
      this.cartService
        .addItem(
          this.product as Product,
          1,
        )
        .subscribe(() => {
          if (isPlatformBrowser(this.platformId)) {
            this.router.navigate(["/checkout"]);
          }
        });
    }
  }
}
