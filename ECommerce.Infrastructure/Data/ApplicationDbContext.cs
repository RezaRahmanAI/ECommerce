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
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
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
    public DbSet<ProductLandingPage> ProductLandingPages { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Global query filter for soft deletes (performance optimization)
        builder.Entity<Category>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<SubCategory>().HasQueryFilter(sc => !sc.IsDeleted);
        builder.Entity<Product>().HasQueryFilter(p => !p.IsDeleted);
        builder.Entity<ProductVariant>().HasQueryFilter(pv => !pv.IsDeleted);
        builder.Entity<Collection>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<BlogPost>().HasQueryFilter(b => !b.IsDeleted);
        builder.Entity<HeroBanner>().HasQueryFilter(h => !h.IsDeleted);
        builder.Entity<Page>().HasQueryFilter(p => !p.IsDeleted);
        builder.Entity<NavigationMenu>().HasQueryFilter(n => !n.IsDeleted);

        // Delivery Method Configuration
        builder.Entity<DeliveryMethod>(entity =>
        {
            entity.Property(d => d.Cost).HasColumnType("decimal(18,2)");
            entity.HasIndex(d => d.IsActive);
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

            // Performance indexes
            entity.HasIndex(p => p.Slug).IsUnique();
            entity.HasIndex(p => p.Sku).IsUnique();
            entity.HasIndex(p => p.CategoryId);
            entity.HasIndex(p => p.SubCategoryId);
            entity.HasIndex(p => p.CollectionId);
            entity.HasIndex(p => p.IsActive);
            entity.HasIndex(p => p.IsFeatured);
            entity.HasIndex(p => p.IsNew);
            entity.HasIndex(p => p.IsItemProduct);
            entity.HasIndex(p => p.StockQuantity);
            entity.HasIndex(p => p.Price);
            entity.HasIndex(p => p.Tier);
            entity.HasIndex(p => p.CreatedAt);
            
            // Composite indexes for common queries
            entity.HasIndex(p => new { p.CategoryId, p.IsActive });
            entity.HasIndex(p => new { p.IsFeatured, p.IsActive });
            entity.HasIndex(p => new { p.IsNew, p.IsActive });
            entity.HasIndex(p => new { p.IsActive, p.Price });
        });

        // Product Landing Page Configuration
        builder.Entity<ProductLandingPage>(entity =>
        {
            entity.HasOne(lp => lp.Product)
                  .WithMany()
                  .HasForeignKey(lp => lp.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(lp => lp.ProductId).IsUnique();
        });
        
        // Product Variant Configuration
        builder.Entity<ProductVariant>(entity =>
        {
            entity.Property(v => v.Price).HasColumnType("decimal(18,2)");
            
            entity.HasOne(v => v.Product)
                  .WithMany(p => p.Variants)
                  .HasForeignKey(v => v.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(v => v.ProductId);
            entity.HasIndex(v => v.Sku).IsUnique();
        });

        // Product Image Configuration
        builder.Entity<ProductImage>(entity =>
        {
            entity.HasIndex(p => p.ProductId);
            entity.HasIndex(p => p.IsMain);
        });

        // Category Self-Referencing Hierarchy
        builder.Entity<Category>(entity =>
        {
            entity.HasOne(c => c.Parent)
                  .WithMany(c => c.ChildCategories)
                  .HasForeignKey(c => c.ParentId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasIndex(c => c.Slug);
            entity.HasIndex(c => c.ParentId);
            entity.HasIndex(c => c.IsActive);
            entity.HasIndex(c => c.DisplayOrder);
        });

        // Category Hierarchy
        builder.Entity<SubCategory>(entity =>
        {
            entity.HasOne(sc => sc.Category)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(sc => sc.CategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(sc => sc.Slug);
            entity.HasIndex(sc => sc.CategoryId);
            entity.HasIndex(sc => sc.IsActive);
        });

        builder.Entity<Collection>(entity =>
        {
            entity.HasOne(c => c.SubCategory)
                  .WithMany(sc => sc.Collections)
                  .HasForeignKey(c => c.SubCategoryId)
                  .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasIndex(c => c.Slug);
            entity.HasIndex(c => c.SubCategoryId);
            entity.HasIndex(c => c.IsActive);
        });

        // Navigation Menu Self-Referencing
        builder.Entity<NavigationMenu>(entity =>
        {
            entity.HasOne(m => m.ParentMenu)
                  .WithMany(m => m.ChildMenus)
                  .HasForeignKey(m => m.ParentMenuId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasIndex(m => m.IsActive);
            entity.HasIndex(m => m.DisplayOrder);
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

            // Performance indexes
            entity.HasIndex(o => o.Status);
            entity.HasIndex(o => o.CreatedAt);
            entity.HasIndex(o => o.OrderNumber);
            entity.HasIndex(o => new { o.Status, o.CreatedAt });
        });

        builder.Entity<OrderItem>(entity =>
        {
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            
            entity.HasOne(i => i.Product)
                  .WithMany()
                  .HasForeignKey(i => i.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);
                  
            entity.HasIndex(i => i.OrderId);
            entity.HasIndex(i => i.ProductId);
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

        // Reviews Configuration
        builder.Entity<Review>(entity =>
        {
            entity.HasIndex(r => r.ProductId);
            entity.HasIndex(r => r.IsApproved);
            entity.HasIndex(r => r.CreatedAt);
            entity.HasIndex(r => new { r.ProductId, r.IsApproved });
        });

        // Blog Posts Configuration
        builder.Entity<BlogPost>(entity =>
        {
            entity.HasIndex(b => b.Slug);
            entity.HasIndex(b => b.Status);
            entity.HasIndex(b => b.CreatedAt);
        });

        // Hero Banners Configuration
        builder.Entity<HeroBanner>(entity =>
        {
            entity.HasIndex(h => h.IsActive);
            entity.HasIndex(h => h.DisplayOrder);
            entity.HasIndex(h => h.StartDate);
            entity.HasIndex(h => h.EndDate);
        });

        // Daily Traffic Configuration
        builder.Entity<DailyTraffic>(entity =>
        {
            entity.HasIndex(d => d.Date).IsUnique();
        });
    }
}
