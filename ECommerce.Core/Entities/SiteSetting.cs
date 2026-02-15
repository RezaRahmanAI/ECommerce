using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class SiteSetting
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(100)]
    public string WebsiteName { get; set; } = "SheraShopBD24";
    
    public string? LogoUrl { get; set; }
    
    [EmailAddress]
    public string? ContactEmail { get; set; }
    
    public string? ContactPhone { get; set; }
    
    public string? Address { get; set; }
    
    // Social Links
    public string? FacebookUrl { get; set; }
    public string? InstagramUrl { get; set; }
    public string? TwitterUrl { get; set; }
    public string? YoutubeUrl { get; set; }
    public string? WhatsAppNumber { get; set; }
    public string? Currency { get; set; } = "BDT";
    public decimal FreeShippingThreshold { get; set; } = 5000;
    public decimal ShippingCharge { get; set; } = 120;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
