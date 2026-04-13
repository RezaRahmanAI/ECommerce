import { Directive, HostListener, Input, inject } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { filter, timer, take, Subscription } from 'rxjs';

/**
 * Speculative Loading Directive
 * Prefetches product data when a user hovers over a product card
 * making the subsequent navigation feel instant.
 */
@Directive({
  selector: '[appPrefetchOnHover]',
  standalone: true
})
export class PrefetchOnHoverDirective {
  @Input('appPrefetchOnHover') slug?: string;
  private readonly productService = inject(ProductService);
  private hoverSubscription?: Subscription;

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.slug) return;

    // Speculative loading: Wait 150ms before fetching to ensure intent
    // (prevents prefetching on fast mouse movements)
    this.hoverSubscription = timer(150).pipe(
      take(1),
      filter(() => !!this.slug)
    ).subscribe(() => {
      this.productService.getBySlug(this.slug!).pipe(take(1)).subscribe();
    });
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.hoverSubscription?.unsubscribe();
  }
}
