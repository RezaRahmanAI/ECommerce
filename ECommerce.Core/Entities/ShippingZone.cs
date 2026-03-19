using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class ShippingZone : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Region { get; set; }

    /// <summary>
    /// Comma-separated list of shipping rates/methods available for this zone.
    /// </summary>
    public string? Rates { get; set; }

    public bool IsActive { get; set; } = true;
}
