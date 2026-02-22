using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Entities;

namespace ECommerce.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<SubCategory> SubCategories { get; set; }
    public DbSet<Collection> Collections { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<NavigationMenu> NavigationMenus { get; set; }
    public DbSet<HeroBanner> HeroBanners { get; set; }
    public DbSet<Page> Pages { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<BlogPost> BlogPosts { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<SiteSetting> SiteSettings { get; set; }
    public DbSet<DailyTraffic> DailyTraffics { get; set; }
    public DbSet<BlockedIp> BlockedIps { get; set; }
    public DbSet<DeliveryMethod> DeliveryMethods { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Delivery Method Configuration
        builder.Entity<DeliveryMethod>(entity =>
        {
            entity.Property(d => d.Cost).HasColumnType("decimal(18,2)");
        });

        // Product Configuration
        builder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            entity.Property(p => p.CompareAtPrice).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PurchaseRate).HasColumnType("decimal(18,2)");
            
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.SubCategory)
                  .WithMany(sc => sc.Products)
                  .HasForeignKey(p => p.SubCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.Collection)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CollectionId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Indexes for Performance
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => p.Sku).IsUnique();
        });
        
        // Product Variant Configuration
        builder.Entity<ProductVariant>(entity =>
        {
            entity.Property(v => v.Price).HasColumnType("decimal(18,2)");
            
            entity.HasOne(v => v.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(v => v.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Category Self-Referencing Hierarchy
        builder.Entity<Category>(entity =>
        {
            entity.HasOne(c => c.Parent)
                  .WithMany(c => c.ChildCategories)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(c => c.Slug);
        });

        // Category Hierarchy
        builder.Entity<SubCategory>(entity =>
        {
            entity.HasOne(sc => sc.Category)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(sc => sc.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(sc => sc.Slug);
        });

        builder.Entity<Collection>(entity =>
        {
            entity.HasOne(c => c.SubCategory)
                  .WithMany(sc => sc.Collections)
                  .HasForeignKey(c => c.SubCategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(c => c.Slug);
        });

        // Navigation Menu Self-Referencing
        builder.Entity<NavigationMenu>(entity =>
        {
            entity.HasOne(m => m.ParentMenu)
                  .WithMany(m => m.ChildMenus)
                  .HasForeignKey(m => m.ParentMenuId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Order Configuration
        builder.Entity<Order>(entity =>
        {
            entity.Property(o => o.SubTotal).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Tax).HasColumnType("decimal(18,2)");
            entity.Property(o => o.ShippingCost).HasColumnType("decimal(18,2)");
            entity.Property(o => o.Total).HasColumnType("decimal(18,2)");
            
            entity.HasMany(o => o.Items)
                  .WithOne(i => i.Order)
                  .HasForeignKey(i => i.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Site Settings
        builder.Entity<SiteSetting>(entity =>
        {
            entity.Property(s => s.FreeShippingThreshold).HasColumnType("decimal(18,2)");
            entity.Property(s => s.ShippingCharge).HasColumnType("decimal(18,2)");
        });

        // Customer Configuration
        builder.Entity<Customer>(entity =>
        {
            entity.HasIndex(c => c.Phone).IsUnique();
        });
    }
}
