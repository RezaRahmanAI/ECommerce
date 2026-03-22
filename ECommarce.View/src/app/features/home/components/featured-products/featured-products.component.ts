import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpContext } from "@angular/common/http";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";

@Component({
  selector: "app-featured-products",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./featured-products.component.html",
  styleUrl: "./featured-products.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeaturedProductsComponent implements OnInit {
  products: Product[] = [];

  constructor(private readonly productService: ProductService, private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.productService
      .getFeaturedProducts(10)
      .subscribe((response) => {
        this.products = response.data;
        this.cdr.markForCheck();
      });
  }

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }
}
