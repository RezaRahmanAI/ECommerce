import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { RouterModule, Router } from "@angular/router";

interface AdminNavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: "app-admin-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./admin-sidebar.component.html",
})
export class AdminSidebarComponent implements OnInit {
  private router = inject(Router);

  topItems: AdminNavItem[] = [
    { label: "Dashboard", icon: "dashboard", route: "/admin/dashboard" },
  ];

  ngOnInit() {
    // Open menu if we are on a products route
    if (
      this.router.url.includes("/admin/products") ||
      this.router.url.includes("/admin/inventory")
    ) {
      this.isProductsMenuOpen = true;
    }
  }

  navItems: AdminNavItem[] = [
    { label: "Orders", icon: "inventory_2", route: "/admin/orders" },
    { label: "Inventory", icon: "warehouse", route: "/admin/inventory" },

    { label: "Banners", icon: "view_carousel", route: "/admin/banners" },
    { label: "Content Pages", icon: "description", route: "/admin/pages" },
    { label: "Reviews", icon: "reviews", route: "/admin/reviews" },
    { label: "Blog", icon: "article", route: "/admin/blog" },
    { label: "Customers", icon: "group", route: "/admin/customers" },
    { label: "Security", icon: "security", route: "/admin/security" },
    { label: "Analytics", icon: "analytics", route: "/admin/analytics" },
  ];

  bottomItems: AdminNavItem[] = [
    { label: "Settings", icon: "settings", route: "/admin/settings" },
  ];

  isProductsMenuOpen = false;

  constructor() {
    // Check initial state
    // We can't easily check router state here without injecting Router,
    // but we can default to false or rely on the user opening it.
    // Better: Inject Router to set initial state.
  }

  toggleProductsMenu() {
    this.isProductsMenuOpen = !this.isProductsMenuOpen;
  }
}
