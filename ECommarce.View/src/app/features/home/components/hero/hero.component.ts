import { Component, OnInit, OnDestroy, inject, signal, PLATFORM_ID, NgZone } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { RouterModule } from "@angular/router";
import { BannerService, HeroBanner } from "../../../../core/services/banner.service";
import { ImageUrlService } from "../../../../core/services/image-url.service";
import { LucideAngularModule, ArrowRight, ArrowLeft, Tag } from "lucide-angular";

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  link: string;
  linkText: string;
  type?: string;
}

@Component({
  selector: "app-hero",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./hero.component.html",
  styleUrl: "./hero.component.css",
})
export class HeroComponent implements OnInit, OnDestroy {
  readonly icons = {
    ArrowRight,
    ArrowLeft,
    Tag,
  };

  private bannerService = inject(BannerService);
  public imageUrlService = inject(ImageUrlService);
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  slides = signal<Slide[]>([]);
  spotlightSlide = signal<Slide | null>(null);
  mainSlides = signal<Slide[]>([]);

  currentSlide = signal(0);
  direction = signal<"next" | "prev">("next");
  timer: any = null;
  isLoaded = signal(false);
  currentYear = new Date().getFullYear();

  defaultSlide: Slide = {
    image: 'https://images.unsplash.com/photo-1512163143273-bde0e3cc7407?q=80&w=2070&auto=format&fit=crop',
    title: 'Summer Collection',
    subtitle: 'Discover the latest trends in fashion. Quality products at unbeatable prices.',
    link: '/shop',
    linkText: 'Shop Now'
  };

  ngOnInit() {
    this.loadBanners();
  }

  loadBanners() {
    const cached = this.getFromLocalCache();
    if (cached) {
      this.setSlides(cached);
      this.refreshInBackground();
    } else {
      this.fetchBanners();
    }
  }

  private getFromLocalCache(): HeroBanner[] | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const cached = localStorage.getItem('hero_banners');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return null;
  }

  private fetchBanners() {
    this.bannerService.getActiveBanners().subscribe({
      next: (banners: HeroBanner[]) => {
        this.setSlides(banners);
        if (isPlatformBrowser(this.platformId) && banners.length > 0) {
          localStorage.setItem('hero_banners', JSON.stringify(banners));
          localStorage.setItem('hero_banners_ts', Date.now().toString());
        }
      },
      error: () => {
        const cached = this.getFromLocalCache();
        if (cached) {
          this.setSlides(cached);
        } else {
          this.setSlides([]);
        }
      }
    });
  }

  private refreshInBackground() {
    if (!isPlatformBrowser(this.platformId)) return;
    const lastFetch = localStorage.getItem('hero_banners_ts');
    const shouldRefresh = !lastFetch || (Date.now() - parseInt(lastFetch)) > 3600000;
    
    if (shouldRefresh) {
      this.bannerService.getActiveBanners().subscribe({
        next: (banners) => {
          if (banners.length > 0) {
            localStorage.setItem('hero_banners', JSON.stringify(banners));
            localStorage.setItem('hero_banners_ts', Date.now().toString());
          }
        }
      });
    }
  }

  private setSlides(banners: HeroBanner[]) {
    if (banners.length === 0) {
      this.slides.set([this.defaultSlide]);
      this.mainSlides.set([this.defaultSlide]);
      this.spotlightSlide.set(null);
      this.isLoaded.set(true);
      this.preloadImages([this.defaultSlide.image]);
      return;
    }

    const slides = banners.map((b: HeroBanner) => ({
      image: this.imageUrlService.getImageUrl(b.imageUrl),
      title: b.title || 'Summer Collection',
      subtitle: b.subtitle || 'Discover the latest trends in fashion.',
      link: b.linkUrl || '/shop',
      linkText: b.buttonText || 'Shop Now',
      type: 'Hero'
    }));

    this.slides.set(slides);
    this.mainSlides.set(slides);
    this.spotlightSlide.set(null);
    this.isLoaded.set(true);
    this.preloadImages(slides.map(s => s.image));

    if (this.mainSlides().length > 1) {
      this.startTimer();
    }
  }

  private preloadImages(urls: string[]) {
    if (!isPlatformBrowser(this.platformId)) return;
    urls.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      this.next();
    }, 5000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next() {
    const slides = this.mainSlides();
    if (slides.length === 0) return;
    
    this.direction.set("next");
    this.currentSlide.set((this.currentSlide() + 1) % slides.length);
  }

  prev() {
    const slides = this.mainSlides();
    if (slides.length === 0) return;
    
    this.direction.set("prev");
    this.currentSlide.set((this.currentSlide() - 1 + slides.length) % slides.length);
  }

  goTo(index: number) {
    const slides = this.mainSlides();
    if (index < 0 || index >= slides.length) return;
    
    this.direction.set(index > this.currentSlide() ? "next" : "prev");
    this.currentSlide.set(index);
    this.stopTimer();
    this.startTimer();
  }
}
