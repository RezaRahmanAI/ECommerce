using System.ComponentModel.DataAnnotations.Schema;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Entities;

public class Product : BaseEntity
{
    public string Headline { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public string Sku { get; set; } = string.Empty; // Kept internally behind the scenes

    // Visibility
    public bool IsActive { get; set; } = true;
    public bool IsNew { get; set; } = false;

    // Pricing & Inventory natively replacing variants
    public decimal PurchaseRate { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public int StockQuantity { get; set; }

    // Content fields matching frontend text areas
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }

    // Relationships
    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
