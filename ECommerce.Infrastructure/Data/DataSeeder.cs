using Microsoft.AspNetCore.Identity;
using ECommerce.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
    {
        // Seed Roles
        if (!await roleManager.RoleExistsAsync("Admin"))
        {
            await roleManager.CreateAsync(new IdentityRole("Admin"));
        }
        
        if (!await roleManager.RoleExistsAsync("User"))
        {
            await roleManager.CreateAsync(new IdentityRole("User"));
        }

        // Seed Admin User
        if (!await userManager.Users.AnyAsync())
        {
            var adminUser = new ApplicationUser
            {
                UserName = "admin@gmail.com",
                Email = "admin@gmail.com",
                FullName = "Admin User",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123");
            
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }
        
        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<Category>
            {
                new Category 
                { 
                    Name = "Men", 
                    Slug = "men", 
                    DisplayOrder = 1,
                    SubCategories = new List<SubCategory>
                    {
                        new SubCategory { Name = "Sherwani", Slug = "sherwani" },
                        new SubCategory { Name = "Thobe", Slug = "thobe" },
                        new SubCategory { Name = "Kabli", Slug = "kabli" },
                        new SubCategory { Name = "Panjabi", Slug = "panjabi" }
                    }
                },
                new Category 
                { 
                    Name = "Women", 
                    Slug = "women", 
                    DisplayOrder = 2,
                    SubCategories = new List<SubCategory>
                    {
                        new SubCategory { Name = "Abaya", Slug = "abaya" },
                        new SubCategory { Name = "Tops", Slug = "tops" },
                        new SubCategory { Name = "Co-ords Dress Set", Slug = "coords" },
                        new SubCategory { Name = "Scarf", Slug = "scarf" }
                    }
                },
                new Category 
                { 
                    Name = "Kids", 
                    Slug = "kids", 
                    DisplayOrder = 3,
                    SubCategories = new List<SubCategory>
                    {
                        new SubCategory { Name = "Girls", Slug = "girls" },
                        new SubCategory { Name = "Boys", Slug = "boys" },
                        new SubCategory { Name = "Mother & Daughter", Slug = "mother-daughter" },
                        new SubCategory { Name = "Father & Son", Slug = "father-son" }
                    }
                },
                new Category 
                { 
                    Name = "Accessories", 
                    Slug = "accessories", 
                    DisplayOrder = 4,
                    SubCategories = new List<SubCategory>
                    {
                        new SubCategory { Name = "Bags", Slug = "bags" },
                        new SubCategory { Name = "Home Decor", Slug = "home-decor" },
                        new SubCategory { Name = "Watches", Slug = "watches" },
                        new SubCategory { Name = "Wallets", Slug = "wallets" }
                    }
                }
            };
            
            await context.Categories.AddRangeAsync(categories);
            await context.SaveChangesAsync();
        }
    }
}
