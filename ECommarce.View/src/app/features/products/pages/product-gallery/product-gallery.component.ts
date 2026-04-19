import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { ActivatedRoute } from "@angular/router";
import { combineLatest } from "rxjs";
import { ProductService } from "../../../../core/services/product.service";
import { Product } from "../../../../core/models/product";
import { ProductCardComponent } from "../../../../shared/components/product-card/product-card.component";
import { ChangeDetectionStrategy, ChangeDetectorRef } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";
import { CategoryService } from "../../../../core/services/category.service";
import { Category } from "../../../../core/models/category";
import { Router } from "@angular/router";

@Component({
  selector: "app-product-gallery",
  standalone: true,
  imports: [CommonModule, ProductCardComponent, AppIconComponent, ScrollingModule],
  templateUrl: "./product-gallery.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGalleryComponent implements OnInit {
  // icons removed
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cdr = inject(ChangeDetectorRef);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  childCategories: any[] = [];
  
  // Sidebar State for Offers/General
  offerCategories: any[] = [];
  isOffersPage = false;
  loading = true;
  title = "Products";
  skeletonItems = Array(8).fill(0);
  
  // For virtual scrolling rows in a grid (e.g. 4 columns)
  productRows: Product[][] = [];
  readonly itemsPerRow = 5;

  constructor() {
    combineLatest([this.route.params, this.route.queryParams])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, queryParams]) => {
        this.loadProducts({ ...params, ...queryParams });
      });
  }

  ngOnInit(): void {
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }

  private loadProducts(params: any): void {
    this.loading = true;
    const { categoryId, collectionSlug, slug } = params;
    const queryParams = this.route.snapshot.queryParams;
    const tier = queryParams["tier"];
    const tags = queryParams["tags"];

    const filterParams: any = {};
    if (tier) filterParams.tier = tier;
    if (tags) filterParams.tags = tags;

    // Determine title based on what slug we have
    if (this.route.snapshot.url[0]?.path === "search") {
      const searchTerm = queryParams["searchTerm"];
      if (searchTerm) {
        filterParams.searchTerm = searchTerm;
        this.title = `Search Results for "${searchTerm}"`;
      } else {
        this.title = "Search Products";
      }
    } else if (this.route.snapshot.url[0]?.path === "category" && slug) {
      filterParams.categorySlug = slug;
      this.title = slug.replace(/-/g, " ");
    } else if (categoryId) {
      filterParams.categoryId = categoryId;
      this.title = categoryId.toString();
    } else if (this.route.snapshot.url[0]?.path === "offers") {
      filterParams.isFeatured = true;
      this.isOffersPage = true;
      this.title = "Offer Products";
    } else if (
      collectionSlug ||
      (this.route.snapshot.url[0]?.path === "collection" && slug)
    ) {
      filterParams.collectionSlug = collectionSlug || slug;
      this.title = (collectionSlug || slug).replace(/-/g, " ");
    }

    this.productService.getProducts(filterParams).subscribe({
      next: (response) => {
        this.products = response.data;
        this.filteredProducts = response.data;
        this.loading = false;
        
        if (this.isOffersPage) {
          this.buildOfferHierarchy();
        }
        
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  navigateToSub(href: string): void {
    this.router.navigateByUrl(href);
  }

  private buildOfferHierarchy(): void {
    if (this.products.length === 0) return;

    this.categoryService.getCategories().subscribe(categories => {
      const hierarchy: any[] = [];
      const productCategories = new Set(this.products.map(p => String(p.categoryId)));
      categories.forEach(cat => {
        const catId = String(cat.id);
        if (productCategories.has(catId)) {
           hierarchy.push({
             id: cat.id,
             name: cat.name,
             imageUrl: cat.imageUrl
           });
        }
      });
      this.offerCategories = hierarchy;
      this.cdr.markForCheck();
    });
  }

  private chunkProductsIntoRows(): void {
    const rows: Product[][] = [];
    for (let i = 0; i < this.products.length; i += this.itemsPerRow) {
      rows.push(this.products.slice(i, i + this.itemsPerRow));
    }
    this.productRows = rows;
  }
}
