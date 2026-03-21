namespace ECommerce.Core.DTOs;

public class ProductLandingPageDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Headline { get; set; }
    public string? VideoUrl { get; set; }
    public string? Subtitle { get; set; }
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? ReviewsTitle { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? ThemeColor { get; set; }
}

public class UpdateProductLandingPageDto
{
    public int ProductId { get; set; }
    public string Headline { get; set; }
    public string? VideoUrl { get; set; }
    public string? Subtitle { get; set; }
    public string? BenefitsTitle { get; set; }
    public string? BenefitsContent { get; set; }
    public string? ReviewsTitle { get; set; }
    public string? SideEffectsTitle { get; set; }
    public string? SideEffectsContent { get; set; }
    public string? UsageTitle { get; set; }
    public string? UsageContent { get; set; }
    public string? ThemeColor { get; set; }
}
