using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public static class ProductSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // 1. Ensure Categories exist
        var categories = new List<Category>
        {
            new Category { Name = "Skin Care", Slug = "skin-care", IsActive = true },
            new Category { Name = "Health & Wellness", Slug = "health-wellness", IsActive = true }
        };

        foreach (var cat in categories)
        {
            if (!await context.Categories.AnyAsync(c => c.Slug == cat.Slug))
            {
                context.Categories.Add(cat);
            }
        }
        await context.SaveChangesAsync();

        var skinCareCat = await context.Categories.FirstAsync(c => c.Slug == "skin-care");
        var healthCat = await context.Categories.FirstAsync(c => c.Slug == "health-wellness");

        // 2. Add Dummy Products
        var products = new List<Product>
        {
            new Product
            {
                Headline = "Luxury 24K Gold Face Serum",
                Slug = "luxury-24k-gold-serum",
                Subtitle = "Infused with pure gold flakes for a radiant, youthful glow.",
                Sku = "SKU-GOLD-001",
                Price = 2500,
                CompareAtPrice = 3500,
                PurchaseRate = 1200,
                StockQuantity = 50,
                IsActive = true,
                IsNew = true,
                CategoryId = skinCareCat.Id,
                BenefitsTitle = "Why You'll Love It",
                BenefitsContent = "• Brightens skin tone instantly\n• Reduces fine lines and wrinkles\n• Hydrates and firms the skin\n• Pure 24K gold flakes for luxury care",
                UsageTitle = "How to Use",
                UsageContent = "Apply 2-3 drops to clean fingertips and gently massage into face and neck until fully absorbed. Use morning and night.",
                SideEffectsTitle = "Precaution",
                SideEffectsContent = "For external use only. Perform a patch test before use. Discontinue if irritation occurs.",
                Images = new List<ProductImage>
                {
                    new ProductImage { Url = "/uploads/products/gold-serum.png", IsMain = true, MediaType = "image" }
                }
            },
            new Product
            {
                Headline = "Organic Vitamin C Brightening Serum",
                Slug = "organic-vitamin-c-serum",
                Subtitle = "Pure radiance in a bottle. Powered by organic citrus extracts.",
                Sku = "SKU-VITC-002",
                Price = 1800,
                CompareAtPrice = 2200,
                PurchaseRate = 800,
                StockQuantity = 100,
                IsActive = true,
                IsNew = true,
                CategoryId = skinCareCat.Id,
                BenefitsTitle = "Key Benefits",
                BenefitsContent = "• Powerful antioxidant protection\n• Fades dark spots and hyperpigmentation\n• Evens out skin texture\n• Promotes collagen production",
                UsageTitle = "Application Guide",
                UsageContent = "Massage into clean skin after toning. Follow with moisturizer and sunscreen during the day.",
                SideEffectsTitle = "Storage",
                SideEffectsContent = "Store in a cool, dark place to maintain efficacy. Keep away from direct sunlight.",
                Images = new List<ProductImage>
                {
                    new ProductImage { Url = "/uploads/products/vitamin-c.png", IsMain = true, MediaType = "image" }
                }
            },
            new Product
            {
                Headline = "Nature's Multi-Collagen Peptides",
                Slug = "natures-collagen-peptides",
                Subtitle = "Supports hair, skin, nails, and joint health from within.",
                Sku = "SKU-COLL-003",
                Price = 3200,
                CompareAtPrice = 4500,
                PurchaseRate = 2100,
                StockQuantity = 30,
                IsActive = true,
                IsNew = true,
                CategoryId = healthCat.Id,
                BenefitsTitle = "Product Highlights",
                BenefitsContent = "• Type I, II, III, V, and X Collagen\n• Grass-fed and pasture-raised\n• Unflavored and easy to mix\n• Supports joint flexibility",
                UsageTitle = "Recommended Dose",
                UsageContent = "Mix one scoop daily into your favorite beverage—coffee, smoothies, or water.",
                SideEffectsTitle = "Dietary Info",
                SideEffectsContent = "Gluten-free, Non-GMO, and Keto-friendly. Consult a physician if pregnant or nursing.",
                Images = new List<ProductImage>
                {
                    new ProductImage { Url = "/uploads/products/collagen.png", IsMain = true, MediaType = "image" }
                }
            }
        };

        foreach (var product in products)
        {
            if (!await context.Products.AnyAsync(p => p.Slug == product.Slug))
            {
                context.Products.Add(product);
            }
        }

        await context.SaveChangesAsync();
    }
}
