import { Directive, ElementRef, HostBinding, Input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appLazyLoad]',
  standalone: true
})
export class LazyLoadDirective implements OnInit, OnDestroy {
  @Input('appLazyLoad') src: string = '';
  @HostBinding('attr.src') srcAttr: string | null = null;

  private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(this.el.nativeElement);
          }
        });
      }, {
        rootMargin: '50px' // Start loading 50px before it enters the viewport
      });

      this.observer.observe(this.el.nativeElement);
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      this.loadImage();
    }
  }

  private loadImage() {
    this.srcAttr = this.src;
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
