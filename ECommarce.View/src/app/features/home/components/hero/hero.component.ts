import { Component, OnInit, OnDestroy, inject, Input, ChangeDetectionStrategy, ChangeDetectorRef, PLATFORM_ID } from "@angular/core";
import { NgOptimizedImage, isPlatformBrowser, NgIf, NgFor, AsyncPipe, NgClass, NgStyle } from "@angular/common"; 
import { RouterModule } from "@angular/router"; 
import { trigger, transition, style, animate } from "@angular/animations";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { AppIconComponent } from "../../../../shared/components/app-icon/app-icon.component";

interface Slide {
  image: string;
  linkUrl: string;
  type?: string;
}

@Component({
  selector: "app-hero",
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, NgClass, NgStyle, RouterModule, AppIconComponent, NgOptimizedImage],
  templateUrl: "./hero.component.html",
  styleUrl: "./hero.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger("slideSlide", [
      transition(":enter", [
        style({ transform: "{{enterStart}}", opacity: 0 }),
        animate(
          "600ms cubic-bezier(0.4, 0, 0.2, 1)",
          style({ transform: "translateX(0)", opacity: 1 }),
        ),
      ], { params: { enterStart: 'translateX(100%)' } }),
      transition(":leave", [
        animate(
          "600ms cubic-bezier(0.4, 0, 0.2, 1)",
          style({ transform: "{{leaveEnd}}", opacity: 0 }),
        ),
      ], { params: { leaveEnd: 'translateX(-100%)' } }),
    ]),
  ],
})
export class HeroComponent implements OnInit, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  public imageUrlService = inject(ImageUrlService);
  private readonly platformId = inject(PLATFORM_ID);

  @Input() slides: Slide[] = [];
  spotlightSlide: Slide | null = null;
  mainSlides: Slide[] = [];

  currentSlide = 0;
  direction: "next" | "prev" = "next";
  timer: any;
  currentYear = new Date().getFullYear();

  ngOnInit() {
    this.spotlightSlide = this.slides.find(s => s.type === 'Spotlight') || null;
    this.mainSlides = this.slides.filter(s => s.type === 'Hero' || !s.type);
    
    if (this.mainSlides.length > 0) {
      this.startTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    if (isPlatformBrowser(this.platformId)) {
      this.timer = setInterval(() => {
        this.next();
      }, 5000);
    }
  }

  stopTimer() {
    if (this.timer && isPlatformBrowser(this.platformId)) {
      clearInterval(this.timer);
    }
  }

  next() {
    this.direction = "next";
    this.currentSlide = (this.currentSlide + 1) % this.mainSlides.length;
    this.cdr.markForCheck();
  }

  prev() {
    this.direction = "prev";
    this.currentSlide =
      (this.currentSlide - 1 + this.mainSlides.length) % this.mainSlides.length;
    this.cdr.markForCheck();
  }

  goTo(index: number) {
    this.direction = index > this.currentSlide ? "next" : "prev";
    this.currentSlide = index;
    this.stopTimer();
    this.startTimer();
    this.cdr.markForCheck();
  }
}
