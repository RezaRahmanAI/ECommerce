import { Routes } from "@angular/router";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";

export const adminRoutes: Routes = [
  { path: "", redirectTo: "dashboard", pathMatch: "full" },
  {
    path: "dashboard",
    loadComponent: () =>
      import("./pages/dashboard-overview/dashboard-overview.component").then(
        (m) => m.DashboardOverviewComponent,
      ),
    data: { title: "Dashboard Overview" },
  },
  {
    path: "products",
    loadComponent: () =>
      import("./pages/admin-products/admin-products.component").then(
        (m) => m.AdminProductsComponent,
      ),
    data: { title: "Products" },
  },
  {
    path: "products/categories",
    loadComponent: () =>
      import("./pages/admin-category-management/admin-category-management.component").then(
        (m) => m.AdminCategoryManagementComponent,
      ),
    data: { title: "Category Management" },
  },
  {
    path: "inventory",
    loadComponent: () =>
      import("./pages/admin-inventory/admin-inventory.component").then(
        (m) => m.AdminInventoryComponent,
      ),
    data: { title: "Inventory Management" },
  },
  {
    path: "products/create",
    loadComponent: () =>
      import("./pages/admin-product-form/admin-product-form.component").then(
        (m) => m.AdminProductFormComponent,
      ),
    data: { title: "Add Product" },
  },
  {
    path: "products/:id/edit",
    loadComponent: () =>
      import("./pages/admin-product-form/admin-product-form.component").then(
        (m) => m.AdminProductFormComponent,
      ),
    data: { title: "Edit Product" },
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./pages/admin-orders/admin-orders.component").then(
        (m) => m.AdminOrdersComponent,
      ),
    data: { title: "Order Management" },
  },
  {
    path: "orders/:id",
    loadComponent: () =>
      import("./pages/admin-order-details/admin-order-details.component").then(
        (m) => m.AdminOrderDetailsComponent,
      ),
    data: { title: "Order Details" },
  },
  {
    path: "customers",
    loadComponent: () =>
      import("./pages/admin-customers/admin-customers.component").then(
        (m) => m.AdminCustomersComponent,
      ),
    data: {
      title: "Customers",
      description: "Customer management",
    },
  },
  {
    path: "analytics",
    loadComponent: () =>
      import("./pages/admin-analytics/admin-analytics.component").then(
        (m) => m.AdminAnalyticsComponent,
      ),
    data: {
      title: "Analytics",
      description: "Performance reports",
    },
  },
  {
    path: "settings",
    loadComponent: () =>
      import("./pages/admin-settings/admin-settings.component").then(
        (m) => m.AdminSettingsComponent,
      ),
    data: { title: "Settings" },
  },
  {
    path: "banners",
    loadComponent: () =>
      import("./pages/admin-banners/admin-banners.component").then(
        (m) => m.AdminBannersComponent,
      ),
    data: { title: "Banners" },
  },
  {
    path: "navigation",
    loadComponent: () =>
      import("./pages/admin-navigation-management/admin-navigation-management.component").then(
        (m) => m.AdminNavigationManagementComponent,
      ),
    data: { title: "Navigation Management" },
  },
  {
    path: "pages",
    loadComponent: () =>
      import("./pages/admin-pages/admin-pages.component").then(
        (m) => m.AdminPagesComponent,
      ),
    data: { title: "Content Pages" },
  },
  {
    path: "reviews",
    loadComponent: () =>
      import("./pages/admin-reviews/admin-reviews.component").then(
        (m) => m.AdminReviewsComponent,
      ),
    data: { title: "Reviews Management" },
  },
  {
    path: "adult-products",
    loadComponent: () =>
      import("./pages/admin-adult-products/admin-adult-products.component").then(
        (m) => m.AdminAdultProductsComponent,
      ),
    data: { title: "Adult Products" },
  },
  {
    path: "adult-products/new",
    loadComponent: () =>
      import("./pages/admin-adult-product-form/admin-adult-product-form.component").then(
        (m) => m.AdminAdultProductFormComponent,
      ),
    data: { title: "Add Adult Product" },
  },
  {
    path: "adult-products/edit/:id",
    loadComponent: () =>
      import("./pages/admin-adult-product-form/admin-adult-product-form.component").then(
        (m) => m.AdminAdultProductFormComponent,
      ),
    data: { title: "Edit Adult Product" },
  },
  {
    path: "security",
    loadComponent: () =>
      import("./pages/admin-blocked-ips/admin-blocked-ips.component").then(
        (m) => m.AdminBlockedIpsComponent,
      ),
    data: { title: "Security & IP Blocking" },
  },
  {
    path: "logout",
    loadComponent: () =>
      import("./pages/admin-logout/admin-logout.component").then(
        (m) => m.AdminLogoutComponent,
      ),
    data: { title: "Logging out" },
  },
];

export default adminRoutes;
