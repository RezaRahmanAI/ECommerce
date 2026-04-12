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

        // 3. Seed Dummy Data for all entities
        await DummyDataSeeder.SeedAsync(context);
    }
}
