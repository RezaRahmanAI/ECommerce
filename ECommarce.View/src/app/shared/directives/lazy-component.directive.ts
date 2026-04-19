import { Directive, ElementRef, TemplateRef, ViewContainerRef, OnInit, OnDestroy, Input, Output, EventEmitter, inject, Renderer2, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appLazyComponent]',
  standalone: true,
  exportAs: 'appLazyComponent'
})
export class LazyComponentDirective implements OnInit, OnDestroy {
  @Input('appLazyComponent') condition: any = true;
  @Output() rendered = new EventEmitter<void>();
  private observer?: IntersectionObserver;
  public hasRendered = false;
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

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

    if (isPlatformBrowser(this.platformId) && 'IntersectionObserver' in window) {
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
      // Use renderer for safe class adding even on server
      if (node.nodeType === 1) { // 1 is ELEMENT_NODE
        this.renderer.addClass(node, 'animate-slide-up');
      }
    });

    this.hasRendered = true;
    setTimeout(() => {
      this.rendered.emit();
    }, 0);
    this.observer?.disconnect();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
