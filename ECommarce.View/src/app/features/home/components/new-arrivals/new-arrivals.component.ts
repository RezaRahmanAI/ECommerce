import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';
import { SectionHeaderComponent } from '../../../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-new-arrivals',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SectionHeaderComponent],
  templateUrl: './new-arrivals.component.html',
  styleUrl: './new-arrivals.component.css',
})
export class NewArrivalsComponent implements OnInit {
  products: Product[] = [];

  constructor(private readonly productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getNewArrivals().subscribe((products) => {
      this.products = products;
    });
  }
}
