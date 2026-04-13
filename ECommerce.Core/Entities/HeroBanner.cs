using System;
using ECommerce.Core.Enums;

namespace ECommerce.Core.Entities;

public class HeroBanner : BaseEntity
{
    public string ImageUrl { get; set; } = string.Empty;
    public string? MobileImageUrl { get; set; }
    public string? LinkUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public BannerType Type { get; set; } = BannerType.Hero;
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
