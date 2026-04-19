import { Component, inject, HostListener, PLATFORM_ID, ChangeDetectorRef, ChangeDetectionStrategy } from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { combineLatest, map, startWith, filter, Subject, debounceTime, distinctUntilChanged, switchMap, tap, of, catchError } from "rxjs";
import { AppIconComponent } from "../../shared/components/app-icon/app-icon.component";

import { AuthService } from "../../core/services/auth.service";
import { CartService } from "../../core/services/cart.service";
import { SiteSettingsService } from "../../core/services/site-settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";
import { NavigationService } from "../../core/services/navigation.service";
import { CustomerProfileService } from "../../core/services/customer-profile.service";
import { ProductService } from "../../core/services/product.service";
import { Product } from "../../core/models/product";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, AppIconComponent, FormsModule],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly settingsService = inject(SiteSettingsService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  public readonly imageUrlService = inject(ImageUrlService);
  private readonly profileService = inject(CustomerProfileService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly productService = inject(ProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  // icons removed

  isMenuOpen = false;
  isSearchOpen = false;
  isCategoriesMenuOpen = false;
  searchQuery = "";
  isScrolled = false;

  // Live Search States
  private searchSubject = new Subject<string>();
  searchResults: Product[] = [];
  isSearching = false;
  showResults = false;

  readonly isHomePage$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event: any) => event.url === "/" || event.url === ""),
    startWith(this.router.url === "/" || this.router.url === ""),
  );

  constructor() {
    this.setupLiveSearch();
  }

  private setupLiveSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.isSearching = true;
        this.showResults = true;
      }),
      switchMap(term => {
        if (!term.trim()) {
          this.isSearching = false;
          return of({ data: [], count: 0 });
        }
        return this.productService.getProducts({ searchTerm: term.trim(), pageSize: 6 }).pipe(
          catchError(() => of({ data: [], count: 0 }))
        );
      }),
      tap(() => {
        this.isSearching = false;
      })
    ).subscribe(response => {
      this.searchResults = response.data;
      this.cdr.markForCheck();
    });
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 35;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isSearchClick = target.closest('#navbar-search-input') || 
                          target.closest('#mobile-search-input') ||
                          target.closest('.search-results-dropdown');
    
    if (!isSearchClick) {
      this.showResults = false;
      this.cdr.markForCheck();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(): void {
    this.showResults = false;
    this.cdr.markForCheck();
  }

  readonly vm$ = combineLatest([
    this.authService.currentUser.pipe(startWith(null)),
    this.cartService.summary$.pipe(
      startWith(this.cartService.getSummarySnapshot()),
    ),
    this.settingsService.getSettings(),
    this.navigationService.getMegaMenu(),
    this.isHomePage$,
    this.profileService.phone$,
  ]).pipe(
    map(([user, summary, settings, menu, isHomePage, customerPhone]) => ({
      user,
      cartCount: summary.itemsCount,
      settings: settings || null,
      menu,
      isHomePage,
      isCustomerLoggedIn: !!customerPhone,
    })),
  );

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    if (this.isMenuOpen) {
      this.isSearchOpen = false; // Close search when menu opens
    }
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isSearchOpen = false;
    this.isCategoriesMenuOpen = false;
  }

  toggleCategoriesMenu(): void {
    this.isCategoriesMenuOpen = !this.isCategoriesMenuOpen;
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  onResultClick(product: Product): void {
    this.router.navigate(['/product', product.slug]);
    this.closeMenu();
    this.showResults = false;
    this.searchQuery = "";
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      this.showResults = !!this.searchQuery;
    }
    if (this.isSearchOpen && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const input = document.getElementById("navbar-search-input");
        if (input) input.focus();
      }, 100);
    }
  }

  toggleMobileSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;
    if (this.isSearchOpen) {
      this.isMenuOpen = false; // Close menu when search opens
      this.showResults = !!this.searchQuery;
    }
    if (this.isSearchOpen && isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const input = document.getElementById("mobile-search-input");
        if (input) input.focus();
      }, 100);
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(["/search"], {
        queryParams: { searchTerm: this.searchQuery.trim() },
      });
      this.isSearchOpen = false;
      this.searchQuery = "";
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
