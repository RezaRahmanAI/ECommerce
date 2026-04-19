import { CommonModule } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import {
  InventoryService,
  ProductInventoryDto,
  VariantInventoryDto,
} from "../../services/inventory.service";
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from "rxjs";
import { AppIconComponent } from "../../../shared/components/app-icon/app-icon.component";

@Component({
  selector: "app-admin-inventory",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent],
  templateUrl: "./admin-inventory.component.html",
})
export class AdminInventoryComponent implements OnInit, OnDestroy {
  // icons removed
  private inventoryService = inject(InventoryService);
  private destroy$ = new Subject<void>();

  products: ProductInventoryDto[] = [];
  filteredProducts: ProductInventoryDto[] = [];
  searchControl = new FormControl("");

  ngOnInit(): void {
    this.loadInventory();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.filterProducts(term);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadInventory(): void {
    this.inventoryService.getInventory().subscribe((data) => {
      this.products = data;
      this.filterProducts(this.searchControl.value);
    });
  }

  filterProducts(term: string | null): void {
    if (!term) {
      this.filteredProducts = this.products;
      return;
    }

    const lowerTerm = term.toLowerCase();
    this.filteredProducts = this.products.filter(
      (p) =>
        p.headline.toLowerCase().includes(lowerTerm) ||
        p.productSku.toLowerCase().includes(lowerTerm),
    );
  }

  updateProductStock(product: ProductInventoryDto, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newQuantity = parseInt(input.value, 10);
    const variant = product.variants[0];

    if (!variant || isNaN(newQuantity) || newQuantity < 0) {
      if (variant) input.value = variant.stockQuantity.toString();
      return;
    }

    this.inventoryService
      .updateStock(variant.variantId, newQuantity)
      .subscribe({
        next: (res) => {
          variant.stockQuantity = newQuantity;
          product.totalStock = res.newTotal;
        },
        error: () => {
          input.value = variant.stockQuantity.toString();
          alert("Failed to update stock");
        },
      });
  }
}
