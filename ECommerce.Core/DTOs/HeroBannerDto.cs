using ECommerce.Core.Enums;

namespace ECommerce.Core.DTOs;

public class HeroBannerDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string MobileImageUrl { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public BannerType Type { get; set; }
}

public class CreateHeroBannerDto
{
    public string ImageUrl { get; set; } = string.Empty;
    public string MobileImageUrl { get; set; } = string.Empty;
    public string LinkUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public BannerType Type { get; set; } = BannerType.Hero;
}
