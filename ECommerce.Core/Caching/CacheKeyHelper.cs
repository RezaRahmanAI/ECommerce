using System.Text.RegularExpressions;

namespace ECommerce.Core.Caching;

public static class CacheKeyHelper
{
    private static readonly Regex SanitizeRegex = new(@"[^a-z0-9_{}]", RegexOptions.Compiled);

    public static string Sanitize(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        var lower = input.ToLowerInvariant().Replace(" ", "_");
        return SanitizeRegex.Replace(lower, "");
    }

    public static string Navbar() => "categories_navbar";
    
    public static string HeroSection() => "hero_section";
    
    public static string ProductListing(int categoryId, int page, string sort, int version) 
        => Sanitize($"products_v{version}_cat{categoryId}_p{page}_sort_{sort}");
        
    public static string ProductDetail(int productId, int version) 
        => Sanitize($"product_v{version}_{productId}");
        
    public static string LandingPage(string slug, int version) 
        => Sanitize($"landing_v{version}_{slug}");
}
