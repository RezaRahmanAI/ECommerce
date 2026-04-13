import { Directive, ElementRef, TemplateRef, ViewContainerRef, OnInit, OnDestroy, Input } from '@angular/core';

@Directive({
  selector: '[appLazyComponent]',
  standalone: true
})
export class LazyComponentDirective implements OnInit, OnDestroy {
  @Input('appLazyComponent') condition: any = true;
  private observer?: IntersectionObserver;
  private hasRendered = false;

  constructor(
    private element: ElementRef,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  ngOnInit() {
    // If condition is explicitly false, render immediately without observer
    if (this.condition === false || this.condition === 'false') {
      this.render();
      return;
    }

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && !this.hasRendered) {
          this.render();
        }
      }, {
        rootMargin: '100px'
      });
      this.observer.observe(this.element.nativeElement.parentElement || this.element.nativeElement);
    } else {
      this.render();
    }
  }

  private render() {
    const viewRef = this.viewContainer.createEmbeddedView(this.templateRef);
    
    // Add animation to the root elements of the rendered view
    viewRef.rootNodes.forEach(node => {
      if (node instanceof HTMLElement) {
        node.classList.add('animate-slide-up');
      }
    });

    this.hasRendered = true;
    this.observer?.disconnect();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
