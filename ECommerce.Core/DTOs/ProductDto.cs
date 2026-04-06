using System.Collections.Generic;
using ECommerce.Core.Enums;

namespace ECommerce.Core.DTOs;

public class ProductDto
{
    public int Id { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string Name => Headline; // Alias for frontend compatibility
    public string Slug { get; set; } = string.Empty;
    public string? Subtitle { get; set; }
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public decimal PurchaseRate { get; set; }
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; }
    public bool IsNew { get; set; }
    
    // Category Info
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    
    // Content Fields
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }

    // Media
    public string? ImageUrl { get; set; }
    public string? ImgUrl => Images?.FirstOrDefault()?.ImageUrl ?? ImageUrl; // Alias for frontend
    public IEnumerable<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
}

public class ProductImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public string? Label { get; set; }
    public bool IsPrimary { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? Color { get; set; }
}

public class ProductListDto
{
    public int Id { get; set; }
    public string Headline { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? CompareAtPrice { get; set; }
    public int StockQuantity { get; set; }
    public bool IsNew { get; set; }
    public bool IsActive { get; set; }
    
    public string CategoryName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public IEnumerable<ProductImageDto> Images { get; set; } = new List<ProductImageDto>();
}
