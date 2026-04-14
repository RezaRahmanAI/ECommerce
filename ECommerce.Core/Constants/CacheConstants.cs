namespace ECommerce.Core.Constants;

public static class CacheConstants
{
    // High-level aggregated data
    public const string HomeData = "home_page_data_aggregated";
    
    // List data
    public const string BannersActive = "banners_active_list";
    public const string CategoriesAll = "categories_all_list";
    public const string CategoriesActive = "categories_active_list";
    public const string NavigationMenu = "navigation_mega_menu_unified";
    public const string FeaturedProducts = "homepage:featured-products";
    public const string NewArrivals = "homepage:new-arrivals";
    
    // Dynamic prefixes
    public const string ProductListPrefix = "product:list";
    public const string CategoryPrefix = "category:";
    public const string ProductDetailPrefix = "product:details";

    // Site Settings
    public const string SiteSettings = "site_settings_unified";
    public const string DeliveryMethodsActive = "delivery_methods_active_list";

    // Review/Social
    public const string FeaturedReviews = "reviews:featured";
    public const string ProductReviewsPrefix = "reviews:product:";
}
