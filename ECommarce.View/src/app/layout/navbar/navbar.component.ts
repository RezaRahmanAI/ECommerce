import { Component, inject, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { combineLatest, map, startWith, filter } from "rxjs";

import { AuthStateService } from "../../core/services/auth-state.service";
import { CartService } from "../../core/services/cart.service";
import { SettingsService } from "../../admin/services/settings.service";
import { ImageUrlService } from "../../core/services/image-url.service";
import { NavigationService } from "../../core/services/navigation.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./navbar.component.html",
  styleUrl: "./navbar.component.css",
})
export class NavbarComponent {
  private readonly authState = inject(AuthStateService);
  private readonly cartService = inject(CartService);
  private readonly settingsService = inject(SettingsService);
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  public readonly imageUrlService = inject(ImageUrlService);

  isMenuOpen = false;
  isScrolled = false;

  readonly isHomePage$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map((event: any) => event.url === "/" || event.url === ""),
    startWith(this.router.url === "/" || this.router.url === ""),
  );

  constructor() {
    this.settingsService.getSettings().subscribe();
  }

  @HostListener("window:scroll", [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 35;
  }

  readonly vm$ = combineLatest([
    this.authState.user$,
    this.cartService.summary$,
    this.settingsService.settings$,
    this.navigationService.getMegaMenu(),
    this.isHomePage$,
  ]).pipe(
    map(([user, summary, settings, menu, isHomePage]) => ({
      user,
      cartCount: summary.itemsCount,
      settings,
      menu,
      isHomePage,
    })),
  );

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

  logout(): void {
    this.authState.logout();
  }
}
