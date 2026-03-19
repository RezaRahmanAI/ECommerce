using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class Customer : BaseEntity
{
    [Required]
    public string Phone { get; set; }  // Unique identifier

    [Required]
    public string Name { get; set; }

    [Required]
    public string Address { get; set; }
    public string? City { get; set; }
    public string? Area { get; set; }
    public string? DeliveryDetails { get; set; }

    public bool IsSuspicious { get; set; } = false;
    public bool IsBlocked { get; set; } = false;
    public string? LastKnownIp { get; set; }
}
