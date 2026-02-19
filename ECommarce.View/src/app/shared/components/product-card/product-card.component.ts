import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import {
  Product,
  RelatedProduct,
  ProductVariant,
} from "../../../core/models/product";
import { BadgeComponent } from "../badge/badge.component";
import { IconButtonComponent } from "../icon-button/icon-button.component";
import { PriceDisplayComponent } from "../price-display/price-display.component";
import { ImageUrlService } from "../../../core/services/image-url.service";

@Component({
  selector: "app-product-card",
  standalone: true,
  imports: [CommonModule, RouterLink, PriceDisplayComponent],
  templateUrl: "./product-card.component.html",
  styleUrl: "./product-card.component.css",
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product | RelatedProduct;

  constructor(public readonly imageUrlService: ImageUrlService) {}

  get mainImage(): string | null {
    return (
      this.product.imageUrl ||
      ("images" in this.product && this.product.images.length > 0
        ? this.product.images[0].imageUrl
        : null)
    );
  }

  get fallbackImageUrl(): string {
    return "imageUrl" in this.product ? this.product.imageUrl || "" : "";
  }

  get selectedColorName(): string {
    if ("images" in this.product && this.product.images?.length > 0) {
      return this.product.images.find((i) => i.color)?.color ?? "";
    }
    return "";
  }

  get hasDiscount(): boolean {
    const price = this.product.price;
    const compareAtPrice =
      "compareAtPrice" in this.product
        ? (this.product.compareAtPrice as number)
        : 0;
    return !!(compareAtPrice && compareAtPrice > 0 && compareAtPrice > price);
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    const price = this.product.price;
    const compareAtPrice = this.originalPrice;
    const discount = (compareAtPrice ?? 0) - price;
    return Math.round((discount / (compareAtPrice || 1)) * 100);
  }

  get originalPrice(): number {
    if ("compareAtPrice" in this.product) {
      return (this.product.compareAtPrice as number) || 0;
    }
    return 0;
  }

  get currentPrice(): number {
    return this.product.price;
  }
}
