using System;
using Microsoft.AspNetCore.Identity;
using ECommerce.Core.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        // 1. Seed Roles
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }

        if (!await roleManager.RoleExistsAsync("User"))
        {
            await roleManager.CreateAsync(new IdentityRole("User"));
        }

        // 2. Ensure Primary Admin User exists
        var primaryAdminEmail = "admin@sherashopbd.com";
        var existingAdmin = await userManager.FindByEmailAsync(primaryAdminEmail);

        if (existingAdmin == null)
        {
            var newAdmin = new ApplicationUser
            {
                UserName = primaryAdminEmail,
                Email = primaryAdminEmail,
                FullName = "System Admin",
                EmailConfirmed = true,
                Role = "Admin"
            };

            var result = await userManager.CreateAsync(newAdmin, "Admin@123!");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(newAdmin, "Admin");
            }
        }

        // Fallback test admin for backwards compatibility
        if (await userManager.FindByEmailAsync("admin@gmail.com") == null)
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@gmail.com",
                Email = "admin@gmail.com",
                FullName = "Admin User",
                EmailConfirmed = true,
                Role = "Admin"
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123");

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // 3. Clear existing seed data (Categories, SubCategories, Products, etc.)
        // This fulfills the request to remove all existing seed data except for login accounts.
        if (await context.Products.AnyAsync() || await context.Categories.AnyAsync() || await context.HeroBanners.AnyAsync())
        {
            // Clear Reviews first due to FKs
            var reviews = await context.Reviews.ToListAsync();
            if (reviews.Any()) context.Reviews.RemoveRange(reviews);

            // Clear Products, Variants, Images
            var products = await context.Products.Include(p => p.Variants).Include(p => p.Images).ToListAsync();
            if (products.Any()) context.Products.RemoveRange(products);

            // Clear Hero Banners
            var banners = await context.HeroBanners.ToListAsync();
            if (banners.Any()) context.HeroBanners.RemoveRange(banners);

            // Clear Categories and SubCategories
            var categories = await context.Categories.Include(c => c.SubCategories).ToListAsync();
            if (categories.Any()) context.Categories.RemoveRange(categories);

            await context.SaveChangesAsync();
        }

        // 4. Seed/Update Site Settings to SheraShopBD (Keep as core config)
        var siteSettings = await context.SiteSettings.FirstOrDefaultAsync();
        if (siteSettings == null)
        {
            siteSettings = new SiteSetting
            {
                WebsiteName = "SheraShopBD",
                ContactEmail = "support@sherashopbd.com",
                ContactPhone = "+880 1234-567890",
                Currency = "BDT",
                FreeShippingThreshold = 5000,
                ShippingCharge = 120
            };
            context.SiteSettings.Add(siteSettings);
            await context.SaveChangesAsync();
        }
        else if (siteSettings.WebsiteName != "SheraShopBD")
        {
            siteSettings.WebsiteName = "SheraShopBD";
            siteSettings.ContactEmail = "support@sherashopbd.com";
            await context.SaveChangesAsync();
        }
    }
}
