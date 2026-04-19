import { Component, EventEmitter, Input, Output, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Product, ProductImage } from "../../../core/models/product";
import { ImageUrlService } from "../../../core/services/image-url.service";
import { AppIconComponent } from "../app-icon/app-icon.component";
import { PriceDisplayComponent } from "../price-display/price-display.component";

@Component({
  selector: "app-quick-add-modal",
  standalone: true,
  imports: [CommonModule, AppIconComponent, PriceDisplayComponent],
  template: `
    <div
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        (click)="close.emit()"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative w-full max-w-lg bg-white shadow-2xl overflow-hidden transform transition-all duration-500 ease-out"
      >
        <!-- Close Button -->
        <button
          (click)="close.emit()"
          class="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-black transition-colors"
        >
          <app-icon name="X" className="w-5 h-5"></app-icon>
        </button>

        <div class="flex flex-col sm:flex-row h-full">
          <!-- Product Image Preview -->
          <div class="w-full sm:w-1/2 aspect-[3/4] bg-gray-50">
            <img
              [src]="imageUrlService.getImageUrl(product.imgUrl || '')"
              [alt]="product.headline"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Selection Details -->
          <div class="flex-1 p-6 flex flex-col justify-center">
            <h2 class="text-sm uppercase tracking-[0.2em] font-bold text-gray-400 mb-1">
              Quick Add
            </h2>
            <h3 class="text-xl font-bold text-black mb-2">{{ product.headline }}</h3>
            
            <div class="flex items-center gap-2 mb-6">
              <app-price-display
                [amount]="product.price"
                class="text-lg font-bold block"
              ></app-price-display>
              <app-price-display
                *ngIf="(product.compareAtPrice || 0) > 0"
                [amount]="product.compareAtPrice || 0"
                size="sm"
                class="line-through opacity-50"
              ></app-price-display>
            </div>

            <!-- Confirm Button -->
            <button
              (click)="confirm()"
              class="w-full py-4 bg-black text-white text-[11px] uppercase tracking-[0.3em] font-bold transition-all duration-300 hover:bg-black/90 flex items-center justify-center gap-2"
            >
              <app-icon name="ShoppingBag" className="w-4 h-4"></app-icon>
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class QuickAddModalComponent {
  @Input({ required: true }) product!: Product;
  @Output() close = new EventEmitter<void>();
  @Output() added = new EventEmitter<void>();

  // icons removed
  readonly imageUrlService = inject(ImageUrlService);

  confirm(): void {
    this.added.emit();
  }
}
