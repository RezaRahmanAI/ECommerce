import { Routes } from "@angular/router";

import { AccessoriesPageComponent } from "./features/accessories/pages/accessories-page/accessories-page.component";
import { AccountPageComponent } from "./features/account/pages/account-page/account-page.component";
import { CartPageComponent } from "./features/cart/pages/cart-page/cart-page.component";
import { ChildrenProductsPageComponent } from "./features/children/pages/children-products-page/children-products-page.component";
import { CheckoutPageComponent } from "./features/checkout/pages/checkout-page/checkout-page.component";
import { HomePageComponent } from "./features/home/pages/home-page/home-page.component";
import { LoginPageComponent } from "./features/login/pages/login-page/login.page";
import { MenProductsPageComponent } from "./features/men/pages/men-products-page/men-products-page.component";
import { OrderConfirmationPageComponent } from "./features/order-confirmation/pages/order-confirmation-page/order-confirmation-page.component";
import { OrdersPageComponent } from "./features/orders/pages/orders-page/orders-page.component";
import { PlaceholderComponent } from "./features/placeholder/placeholder.component";
import { BlogDetailsComponent } from "./features/blog/pages/blog-details/blog-details.component";
import { BlogListComponent } from "./features/blog/pages/blog-list/blog-list.component";
import { ProductDetailsPageComponent } from "./features/product-details/pages/product-details-page/product-details-page.component";
import { OfferDetailsPageComponent } from "./features/offers/pages/offer-details-page/offer-details-page.component";
import { WomenProductsPageComponent } from "./features/women/pages/women-products-page/women-products-page.component";
import { ProfilePageComponent } from "./features/customer-profile/pages/profile-page/profile-page.component";
import { LandingPageComponent } from "./features/landing-page/pages/landing-page/landing-page.component";
import { AdminLayoutComponent } from "./admin/layout/admin-layout/admin-layout.component";
import { DashboardOverviewComponent } from "./admin/pages/dashboard-overview/dashboard-overview.component";
import { AdminPlaceholderComponent } from "./admin/pages/admin-placeholder/admin-placeholder.component";
import { AdminLogoutComponent } from "./admin/pages/admin-logout/admin-logout.component";
import { AdminOrderDetailsComponent } from "./admin/pages/admin-order-details/admin-order-details.component";
import { AdminOrdersComponent } from "./admin/pages/admin-orders/admin-orders.component";
import { AdminProductFormComponent } from "./admin/pages/admin-product-form/admin-product-form.component";
import { AdminProductsComponent } from "./admin/pages/admin-products/admin-products.component";
import { AdminCategoryManagementComponent } from "./admin/pages/admin-category-management/admin-category-management.component";
import { AdminSubCategoryManagementComponent } from "./admin/pages/admin-sub-category-management/admin-sub-category-management.component";
import { AdminSettingsComponent } from "./admin/pages/admin-settings/admin-settings.component";
import { AdminAnalyticsComponent } from "./admin/pages/admin-analytics/admin-analytics.component";
import { AdminBlogPostsComponent } from "./admin/pages/admin-blog-posts/admin-blog-posts.component";
import { AdminCustomersComponent } from "./admin/pages/admin-customers/admin-customers.component";
import { AdminBannersComponent } from "./admin/pages/admin-banners/admin-banners.component";
import { AdminNavigationManagementComponent } from "./admin/pages/admin-navigation-management/admin-navigation-management.component";
import { AdminPagesComponent } from "./admin/pages/admin-pages/admin-pages.component";
import { AdminReviewsComponent } from "./admin/pages/admin-reviews/admin-reviews.component";
import { AdminBlockedIpsComponent } from "./admin/pages/admin-blocked-ips/admin-blocked-ips.component";
import { AdminInventoryComponent } from "./admin/pages/admin-inventory/admin-inventory.component";

import { AboutComponent } from "./pages/about/about.component";
import { ContactComponent } from "./pages/contact/contact.component";
import { ProductGalleryComponent } from "./features/products/pages/product-gallery/product-gallery.component";

import { authGuard } from "./core/guards/auth.guard";
import { AdminGuard } from "./admin/guards/admin.guard";

export const appRoutes: Routes = [
  { path: "", component: HomePageComponent },
  { path: "men", component: MenProductsPageComponent },
  { path: "women", component: WomenProductsPageComponent },
  { path: "children", component: ChildrenProductsPageComponent },
  { path: "accessories", component: AccessoriesPageComponent },
  { path: "products", redirectTo: "women", pathMatch: "full" },
  {
    path: "search",
    component: ProductGalleryComponent,
    title: "Search Results",
  },

  { path: "about", component: AboutComponent, title: "About Us" },
  { path: "contact", component: ContactComponent, title: "Contact" },
  {
    path: "product/:slug",
    component: ProductDetailsPageComponent,
  },
  {
    path: "lp/:slug",
    component: LandingPageComponent,
  },
  {
    path: "offer/:slug",
    component: OfferDetailsPageComponent,
  },
  { path: "cart", component: CartPageComponent },
  { path: "checkout", component: CheckoutPageComponent },
  {
    path: "order-confirmation/:orderId",
    component: OrderConfirmationPageComponent,
  },
  {
    path: "track/:orderId",
    component: PlaceholderComponent,
    data: {
      title: "Track Order",
      description: "Order tracking experience coming soon.",
    },
  },
  { path: "login", component: LoginPageComponent },
  {
    path: "forgot-password",
    component: PlaceholderComponent,
    data: {
      title: "Forgot Password",
      description: "Password recovery experience coming soon.",
    },
  },
  {
    path: "blog",
    component: BlogListComponent,
  },
  {
    path: "blog/:slug",
    component: BlogDetailsComponent,
  },
  {
    path: "profile",
    component: ProfilePageComponent,
  },
  {
    path: "account",
    component: AccountPageComponent,
    canActivate: [authGuard],
  },
  {
    path: "orders",
    component: OrdersPageComponent,
    canActivate: [authGuard],
  },
  {
    path: "admin",
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        component: DashboardOverviewComponent,
        data: { title: "Dashboard Overview" },
      },
      {
        path: "products",
        component: AdminProductsComponent,
        data: { title: "Products" },
      },
      {
        path: "products/categories",
        component: AdminCategoryManagementComponent,
        data: { title: "Category Management" },
      },
      {
        path: "products/sub-categories",
        component: AdminSubCategoryManagementComponent,
        data: { title: "Sub Category Management" },
      },
      {
        path: "inventory",
        component: AdminInventoryComponent,
        data: { title: "Inventory Management" },
      },
      {
        path: "products/create",
        component: AdminProductFormComponent,
        data: { title: "Add Product" },
      },
      {
        path: "products/:id/edit",
        component: AdminProductFormComponent,
        data: { title: "Edit Product" },
      },
      {
        path: "orders",
        component: AdminOrdersComponent,
        data: { title: "Order Management" },
      },
      {
        path: "blog",
        component: AdminBlogPostsComponent,
        data: { title: "Blog Posts" },
      },
      {
        path: "orders/:id",
        component: AdminOrderDetailsComponent,
        data: { title: "Order Details" },
      },
      {
        path: "customers",
        component: AdminCustomersComponent,
        data: {
          title: "Customers",
          description: "Customer management",
        },
      },
      {
        path: "analytics",
        component: AdminAnalyticsComponent,
        data: {
          title: "Analytics",
          description: "Performance reports",
        },
      },
      {
        path: "settings",
        component: AdminSettingsComponent,
        data: { title: "Settings" },
      },
      {
        path: "banners",
        component: AdminBannersComponent,
        data: { title: "Banners" },
      },
      {
        path: "navigation",
        component: AdminNavigationManagementComponent,
        data: { title: "Navigation Management" },
      },
      {
        path: "pages",
        component: AdminPagesComponent,
        data: { title: "Content Pages" },
      },
      {
        path: "reviews",
        component: AdminReviewsComponent,
        data: { title: "Reviews Management" },
      },
      {
        path: "security",
        component: AdminBlockedIpsComponent,
        data: { title: "Security & IP Blocking" },
      },
      {
        path: "logout",
        component: AdminLogoutComponent,
        data: { title: "Logging out" },
      },
    ],
  },
  { path: "category/:slug", component: ProductGalleryComponent },
  { path: "subcategory/:slug", component: ProductGalleryComponent },
  { path: "collection/:slug", component: ProductGalleryComponent },
  { path: "shop/:categorySlug", component: ProductGalleryComponent },
  {
    path: "shop/:categorySlug/:subCategorySlug",
    component: ProductGalleryComponent,
  },
  { path: "**", redirectTo: "" },
];
