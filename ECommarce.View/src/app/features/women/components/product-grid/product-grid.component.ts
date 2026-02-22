import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";

import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-women-product-grid",
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  templateUrl: "./product-grid.component.html",
  styleUrl: "./product-grid.component.css",
})
export class WomenProductGridComponent implements OnInit {
  products: Product[] = [];

  constructor(
    private readonly productService: ProductService,
    readonly imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.productService.getProducts({ gender: "women" }).subscribe((res) => {
      this.products = res.data;
    });
  }
}
