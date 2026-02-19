import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { PriceDisplayComponent } from "../../../../shared/components/price-display/price-display.component";

import { ImageUrlService } from "../../../../core/services/image-url.service";

@Component({
  selector: "app-accessories-page",
  standalone: true,
  imports: [CommonModule, RouterLink, PriceDisplayComponent],
  templateUrl: "./accessories-page.component.html",
  styleUrl: "./accessories-page.component.css",
})
export class AccessoriesPageComponent implements OnInit {
  products: Product[] = [];

  constructor(
    private readonly productService: ProductService,
    readonly imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.productService
      .getProducts({ category: "Accessories" })
      .subscribe((products: Product[]) => {
        this.products = products;
      });
  }
}
