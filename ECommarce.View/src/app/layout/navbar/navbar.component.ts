import { Component, inject, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { toObservable } from "@angular/core/rxjs-interop";

import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { combineLatest, map, startWith, filter } from "rxjs";
import {
  LucideAngularModule,
  Search,
  User,
  ShoppingBag,
  Menu,
  X,
  ChevronDown,
  Facebook,
  Instagram,
  Twitter,
  Tag,
} from "lucide-angular";

import { AuthService } from "../../core/services/auth.service";
import { CartService } from "../../core/services/cart.service";
import { SiteSettingsService } from "../../core/services/site-settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";
import { NavigationService } from "../../core/services/navigation.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule, FormsModule],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);
  private readonly cartService = inject(CartService);
  private readonly settingsService = inject(SiteSettingsService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  public readonly imageUrlService = inject(ImageUrlService);

  readonly icons = {
    Search,
    User,
    ShoppingBag,
    Menu,
    X,
    ChevronDown,
    Facebook,
    Instagram,
    Twitter,
    Tag,
  };

  isMenuOpen = false;
  isCategoriesOpen = false;
  searchQuery = "";
  isScrolled = false;

  readonly isHomePage$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event: any) => event.url === "/" || event.url === ""),
    startWith(this.router.url === "/" || this.router.url === ""),
  );

  constructor() {
    // Subscription handled by async pipe in template
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 35;
  }

  readonly vm$ = combineLatest({
    user: this.authService.currentUser,
    summary: this.cartService.summary$,
    settings: this.settingsService.getSettings(),
    menu: this.navigationService.getMegaMenu(),
    isHomePage: this.isHomePage$,
  }).pipe(
    map(({ user, summary, settings, menu, isHomePage }) => {
      const filteredMenu = menu.filter(item => 
        !['offer', 'offers'].includes(item.name.toLowerCase())
      );
      return {
        user,
        cartCount: summary.itemsCount,
        settings: settings || null,
        menu: filteredMenu,
        navLinks: filteredMenu.slice(0, 4),
        isHomePage,
      };
    }),
  );

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleCategories(): void {
    this.isCategoriesOpen = !this.isCategoriesOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isCategoriesOpen = false;
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(["/search"], {
        queryParams: { searchTerm: this.searchQuery.trim() },
      });
      this.searchQuery = "";
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
