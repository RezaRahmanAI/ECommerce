using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class ProductCreateDto
{
    [Required(ErrorMessage = "Product headline is required")]
    [MaxLength(200)]
    public string Headline { get; set; } = string.Empty;
    
    public string Slug { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Subtitle { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool NewArrival { get; set; }
    
    [Required(ErrorMessage = "Category is required")]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 1000000)]
    public decimal Price { get; set; }
    
    public decimal? CompareAtPrice { get; set; }
    
    [Range(0, 1000000)]
    public decimal PurchaseRate { get; set; }
    
    public int StockQuantity { get; set; }
    
    // Flat image array from frontend
    public List<ProductImageInputDto> Images { get; set; } = new();
    
    // Content fields
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
}

public class ProductUpdateDto
{
    [Required(ErrorMessage = "Product headline is required")]
    [MaxLength(200)]
    public string Headline { get; set; } = string.Empty;
    
    public string Slug { get; set; } = string.Empty;
    
    [MaxLength(2000)]
    public string? Subtitle { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool NewArrival { get; set; }
    
    [Required(ErrorMessage = "Category is required")]
    [MaxLength(100)]
    public string Category { get; set; } = string.Empty;
    
    [Required]
    [Range(0.01, 1000000)]
    public decimal Price { get; set; }
    
    public decimal? CompareAtPrice { get; set; }
    
    [Range(0, 1000000)]
    public decimal PurchaseRate { get; set; }
    
    public int StockQuantity { get; set; }
    
    public List<ProductImageInputDto> Images { get; set; } = new();
    
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
}

public class ProductImageInputDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public bool IsPrimary { get; set; }
    public string? Type { get; set; }
}
