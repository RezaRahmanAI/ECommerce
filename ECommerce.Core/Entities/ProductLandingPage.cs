using System.ComponentModel.DataAnnotations.Schema;

namespace ECommerce.Core.Entities;

public class ProductLandingPage : BaseEntity
{
    public int ProductId { get; set; }
    public Product Product { get; set; }

    public string Headline { get; set; }
    public string? VideoUrl { get; set; }
    
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; } // HTML content
    
    public string? ReviewsTitle { get; set; }
    public string? ReviewsImages { get; set; } // JSON array of image URLs
    
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; } // HTML content
    
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; } // HTML content
    
    public string? ThemeColor { get; set; } // Hex color code
}
