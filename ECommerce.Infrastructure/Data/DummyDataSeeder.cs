using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public static class DummyDataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        Console.WriteLine(">>> Starting DummyDataSeeder...");
        await SeedSiteSettingsAsync(context);
        Console.WriteLine(">>> Seeded SiteSettings.");
        await SeedCategoriesAsync(context);
        Console.WriteLine(">>> Seeded Categories.");
        await SeedDeliveryMethodsAsync(context);
        Console.WriteLine(">>> Seeded DeliveryMethods.");
        await SeedPagesAsync(context);
        Console.WriteLine(">>> Seeded Pages.");
        await SeedHeroBannersAsync(context);
        Console.WriteLine(">>> Seeded HeroBanners.");
        await SeedNavigationMenusAsync(context);
        Console.WriteLine(">>> Seeded NavigationMenus.");
        await SeedCollectionsAsync(context);
        Console.WriteLine(">>> Seeded Collections.");
        await SeedProductsAsync(context);
        Console.WriteLine(">>> Seeded Products.");
        await SeedCustomersAsync(context);
        Console.WriteLine(">>> Seeded Customers.");
        await SeedOrdersAsync(context);
        Console.WriteLine(">>> Seeded Orders.");
        await SeedReviewsAsync(context);
        Console.WriteLine(">>> Seeded Reviews.");
        Console.WriteLine(">>> DummyDataSeeder Completed Successfully.");
    }

    private static async Task SeedSiteSettingsAsync(ApplicationDbContext context)
    {
        if (await context.SiteSettings.AnyAsync()) return;

        var settings = new SiteSetting
        {
            WebsiteName = "SheraShopBD",
            ContactEmail = "support@sherashopbd.com",
            ContactPhone = "+8801700000000",
            Address = "House 123, Road 4, Dhanmondi, Dhaka, Bangladesh",
            FacebookUrl = "https://facebook.com/sherashopbd",
            InstagramUrl = "https://instagram.com/sherashopbd",
            TwitterUrl = "https://twitter.com/sherashopbd",
            YoutubeUrl = "https://youtube.com/sherashopbd",
            WhatsAppNumber = "8801700000000",
            Currency = "BDT",
            FreeShippingThreshold = 5000,
            ShippingCharge = 120,
            LogoUrl = "/assets/images/logo.png"
        };

        context.SiteSettings.Add(settings);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAsync(ApplicationDbContext context)
    {
        var categories = new List<Category>
        {
            new Category { Name = "Skin Care", Slug = "skin-care", IsActive = true },
            new Category { Name = "Health & Wellness", Slug = "health-wellness", IsActive = true },
            new Category { Name = "Electronics", Slug = "electronics", IsActive = true },
            new Category { Name = "Fashion", Slug = "fashion", IsActive = true },
            new Category { Name = "Home & Living", Slug = "home-living", IsActive = true },
            new Category { Name = "Gadget & Accessories", Slug = "gadgets", IsActive = true }
        };

        foreach (var cat in categories)
        {
            if (!await context.Categories.AnyAsync(c => c.Slug == cat.Slug))
            {
                context.Categories.Add(cat);
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedDeliveryMethodsAsync(ApplicationDbContext context)
    {
        if (await context.DeliveryMethods.AnyAsync()) return;

        var methods = new List<DeliveryMethod>
        {
            new DeliveryMethod { Name = "Standard Inside Dhaka", Cost = 60, EstimatedDays = "1-2 Days", IsActive = true },
            new DeliveryMethod { Name = "Standard Outside Dhaka", Cost = 120, EstimatedDays = "3-5 Days", IsActive = true },
            new DeliveryMethod { Name = "Express Delivery", Cost = 150, EstimatedDays = "24 Hours", IsActive = true }
        };

        context.DeliveryMethods.AddRange(methods);
        await context.SaveChangesAsync();
    }

    private static async Task SeedPagesAsync(ApplicationDbContext context)
    {
        if (await context.Pages.AnyAsync()) return;

        var pages = new List<Page>
        {
            new Page 
            { 
                Title = "About Us", 
                Slug = "about-us", 
                Content = "<h1>About SheraShopBD</h1><p>We provide the best quality products in Bangladesh.</p>",
                MetaTitle = "About Us | SheraShopBD"
            },
            new Page 
            { 
                Title = "Contact Us", 
                Slug = "contact-us", 
                Content = "<h1>Contact Us</h1><p>Email: support@sherashopbd.com</p>",
                MetaTitle = "Contact Us | SheraShopBD"
            },
            new Page 
            { 
                Title = "Privacy Policy", 
                Slug = "privacy-policy", 
                Content = "<h1>Privacy Policy</h1><p>Your privacy is important to us.</p>",
                MetaTitle = "Privacy Policy | SheraShopBD"
            },
            new Page 
            { 
                Title = "Terms & Conditions", 
                Slug = "terms-conditions", 
                Content = "<h1>Terms & Conditions</h1><p>Standard terms of service.</p>",
                MetaTitle = "Terms & Conditions | SheraShopBD"
            }
        };

        context.Pages.AddRange(pages);
        await context.SaveChangesAsync();
    }

    private static async Task SeedHeroBannersAsync(ApplicationDbContext context)
    {
        if (await context.HeroBanners.AnyAsync()) return;

        var banners = new List<HeroBanner>
        {
            new HeroBanner 
            { 
                ImageUrl = "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2000&auto=format&fit=crop",
                LinkUrl = "/category/fashion",
                DisplayOrder = 1,
                Type = BannerType.Hero
            },
            new HeroBanner 
            { 
                ImageUrl = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=2000&auto=format&fit=crop",
                LinkUrl = "/category/skin-care",
                DisplayOrder = 2,
                Type = BannerType.Hero
            }
        };

        context.HeroBanners.AddRange(banners);
        await context.SaveChangesAsync();
    }

    private static async Task SeedNavigationMenusAsync(ApplicationDbContext context)
    {
        if (await context.NavigationMenus.AnyAsync()) return;

        var menus = new List<NavigationMenu>
        {
            new NavigationMenu { Title = "Home", Url = "/", DisplayOrder = 1 },
            new NavigationMenu { Title = "Shop", Url = "/shop", DisplayOrder = 2 },
            new NavigationMenu { Title = "Categories", Url = "/categories", DisplayOrder = 3, IsMegaMenu = true },
            new NavigationMenu { Title = "About", Url = "/page/about-us", DisplayOrder = 4 },
            new NavigationMenu { Title = "Contact", Url = "/page/contact-us", DisplayOrder = 5 }
        };

        context.NavigationMenus.AddRange(menus);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCollectionsAsync(ApplicationDbContext context)
    {
        if (await context.Collections.AnyAsync()) return;

        var categories = await context.Categories.ToListAsync();
        var skinCare = categories.FirstOrDefault(c => c.Slug == "skin-care");
        var health = categories.FirstOrDefault(c => c.Slug == "health-wellness");

        if (skinCare == null || health == null) return;

        var collections = new List<Collection>
        {
            new Collection 
            { 
                Name = "Featured Skin Care", 
                Slug = "featured-skin-care", 
                CategoryId = skinCare.Id, 
                Description = "Best selling skin care products",
                DisplayOrder = 1
            },
            new Collection 
            { 
                Name = "Health Booster", 
                Slug = "health-booster", 
                CategoryId = health.Id, 
                Description = "Essential supplements for daily life",
                DisplayOrder = 2
            }
        };

        context.Collections.AddRange(collections);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProductsAsync(ApplicationDbContext context)
    {
        var categories = await context.Categories.ToListAsync();
        var skinCare = categories.FirstOrDefault(c => c.Slug == "skin-care");
        var health = categories.FirstOrDefault(c => c.Slug == "health-wellness");
        var gadgets = categories.FirstOrDefault(c => c.Slug == "gadgets");

        var products = new List<Product>();

        if (skinCare != null)
        {
            products.Add(new Product
            {
                Headline = "Anti-Aging Night Cream",
                Slug = "anti-aging-night-cream",
                Subtitle = "Revitalize your skin while you sleep.",
                Sku = "SKU-NIGHT-001",
                Price = 1500,
                CompareAtPrice = 2000,
                PurchaseRate = 800,
                StockQuantity = 50,
                IsActive = true,
                CategoryId = skinCare.Id,
                BenefitsTitle = "Key Benefits",
                BenefitsContent = "• Reduces wrinkles\n• Deep hydration\n• Improves skin elasticity",
                UsageTitle = "How to Use",
                UsageContent = "Apply a small amount to clean face and neck before bed.",
                SideEffectsTitle = "Precaution",
                SideEffectsContent = "For external use only. Discontinue if irritation occurs.",
                Images = new List<ProductImage> { new ProductImage { Url = "https://images.unsplash.com/photo-1620916566398-39f1143f2c48?q=80&w=1000&auto=format&fit=crop", IsMain = true, MediaType = "image" } }
            });
            products.Add(new Product
            {
                Headline = "Aloe Vera Soothing Gel",
                Slug = "aloe-vera-gel",
                Subtitle = "Natural cooling and hydration.",
                Sku = "SKU-ALOE-002",
                Price = 450,
                CompareAtPrice = 600,
                PurchaseRate = 200,
                StockQuantity = 150,
                IsActive = true,
                CategoryId = skinCare.Id,
                BenefitsTitle = "Why You'll Love It",
                BenefitsContent = "• Soothes sunburns\n• Hydrates skin\n• Non-sticky formula",
                UsageTitle = "Application",
                UsageContent = "Apply generously to skin as needed.",
                SideEffectsTitle = "Side Effects",
                SideEffectsContent = "Rarely causes redness in extremely sensitive skin.",
                Images = new List<ProductImage> { new ProductImage { Url = "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1000&auto=format&fit=crop", IsMain = true, MediaType = "image" } }
            });
        }

        if (health != null)
        {
            products.Add(new Product
            {
                Headline = "Daily Multi-Vitamin",
                Slug = "daily-multi-vitamin",
                Subtitle = "All your essential nutrients in one capsule.",
                Sku = "SKU-VIT-001",
                Price = 1200,
                CompareAtPrice = 1500,
                PurchaseRate = 600,
                StockQuantity = 80,
                IsActive = true,
                CategoryId = health.Id,
                BenefitsTitle = "Health Benefits",
                BenefitsContent = "• Boosts immunity\n• Increases energy\n• Supports total wellbeing",
                UsageTitle = "Dosage Instructions",
                UsageContent = "Take one tablet daily with a meal.",
                SideEffectsTitle = "Precaution",
                SideEffectsContent = "Store in a cool dry place. Keep out of reach of children.",
                Images = new List<ProductImage> { new ProductImage { Url = "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=1000&auto=format&fit=crop", IsMain = true, MediaType = "image" } }
            });
        }

        if (gadgets != null)
        {
            products.Add(new Product
            {
                Headline = "Wireless Earbuds Pro",
                Slug = "wireless-earbuds-pro",
                Subtitle = "High fidelity sound with hybrid ANC.",
                Sku = "SKU-EAR-001",
                Price = 3500,
                CompareAtPrice = 5000,
                PurchaseRate = 1800,
                StockQuantity = 40,
                IsActive = true,
                CategoryId = gadgets.Id,
                BenefitsTitle = "Top Features",
                BenefitsContent = "• 30 Hours Battery\n• Fast Charging\n• Active Noise Cancellation",
                UsageTitle = "Pairing Guide",
                UsageContent = "Open case to enter pairing mode. Select 'Wireless Earbuds Pro' from Bluetooth settings.",
                SideEffectsTitle = "Maintenance",
                SideEffectsContent = "Clean ear tips regularly with a dry cloth.",
                Images = new List<ProductImage> { new ProductImage { Url = "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop", IsMain = true, MediaType = "image" } }
            });
        }

        context.Products.AddRange(products);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCustomersAsync(ApplicationDbContext context)
    {
        if (await context.Customers.AnyAsync()) return;

        var customers = new List<Customer>
        {
            new Customer { Name = "John Doe", Phone = "01711111111", Address = "Dhanmondi, Dhaka" },
            new Customer { Name = "Jane Smith", Phone = "01822222222", Address = "Banani, Dhaka" },
            new Customer { Name = "Karim Uddin", Phone = "01933333333", Address = "Mirpur, Dhaka" }
        };

        context.Customers.AddRange(customers);
        await context.SaveChangesAsync();
    }

    private static async Task SeedOrdersAsync(ApplicationDbContext context)
    {
        if (await context.Orders.AnyAsync()) return;

        var products = await context.Products.Take(2).ToListAsync();
        var deliveryMethod = await context.DeliveryMethods.FirstOrDefaultAsync();

        if (products.Count < 2 || deliveryMethod == null) return;

        var orders = new List<Order>
        {
            new Order
            {
                OrderNumber = "ORD-2024-1001",
                CustomerName = "John Doe",
                CustomerPhone = "01711111111",
                ShippingAddress = "House 1, Road 2, Dhanmondi",
                City = "Dhaka",
                Area = "Dhanmondi",
                SubTotal = products[0].Price + products[1].Price,
                ShippingCost = deliveryMethod.Cost,
                Total = products[0].Price + products[1].Price + deliveryMethod.Cost,
                Status = OrderStatus.Pending,
                DeliveryMethodId = deliveryMethod.Id,
                Items = new List<OrderItem>
                {
                    new OrderItem 
                    { 
                        ProductId = products[0].Id, 
                        ProductName = products[0].Headline, 
                        UnitPrice = products[0].Price, 
                        Quantity = 1,
                        ImageUrl = products[0].Images.FirstOrDefault()?.Url
                    },
                    new OrderItem 
                    { 
                        ProductId = products[1].Id, 
                        ProductName = products[1].Headline, 
                        UnitPrice = products[1].Price, 
                        Quantity = 1,
                        ImageUrl = products[1].Images.FirstOrDefault()?.Url
                    }
                }
            },
            new Order
            {
                OrderNumber = "ORD-2024-1002",
                CustomerName = "Jane Smith",
                CustomerPhone = "01822222222",
                ShippingAddress = "Apartment 4B, Banani Avenue",
                City = "Dhaka",
                Area = "Banani",
                SubTotal = products[0].Price * 2,
                ShippingCost = deliveryMethod.Cost,
                Total = (products[0].Price * 2) + deliveryMethod.Cost,
                Status = OrderStatus.Delivered,
                DeliveryMethodId = deliveryMethod.Id,
                Items = new List<OrderItem>
                {
                    new OrderItem 
                    { 
                        ProductId = products[0].Id, 
                        ProductName = products[0].Headline, 
                        UnitPrice = products[0].Price, 
                        Quantity = 2,
                        ImageUrl = products[0].Images.FirstOrDefault()?.Url
                    }
                }
            }
        };

        context.Orders.AddRange(orders);
        await context.SaveChangesAsync();
    }

    private static async Task SeedReviewsAsync(ApplicationDbContext context)
    {
        if (await context.Reviews.AnyAsync()) return;

        var products = await context.Products.Take(2).ToListAsync();
        if (products.Count == 0) return;

        var reviews = new List<Review>
        {
            new Review 
            { 
                ProductId = products[0].Id, 
                CustomerName = "Alice", 
                Rating = 5, 
                Comment = "Excellent product! Highly recommended.",
                IsApproved = true
            },
            new Review 
            { 
                ProductId = products[0].Id, 
                CustomerName = "Bob", 
                Rating = 4, 
                Comment = "Good, but shipping took a bit longer.",
                IsApproved = true
            }
        };

        context.Reviews.AddRange(reviews);
        await context.SaveChangesAsync();
    }
}
