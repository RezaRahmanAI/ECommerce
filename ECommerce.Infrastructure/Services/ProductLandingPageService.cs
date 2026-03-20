using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Core.DTOs;
using ECommerce.Infrastructure.Data;

namespace ECommerce.Infrastructure.Services;

public class ProductLandingPageService : IProductLandingPageService
{
    private readonly ApplicationDbContext _context;

    public ProductLandingPageService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ProductLandingPageDto?> GetByProductSlugAsync(string slug)
    {
        var lp = await _context.ProductLandingPages
            .Include(lp => lp.Product)
            .FirstOrDefaultAsync(lp => lp.Product.Slug == slug);

        if (lp == null) return null;

        return MapToDto(lp);
    }

    public async Task<ProductLandingPageDto?> GetByProductIdAsync(int productId)
    {
        var lp = await _context.ProductLandingPages
            .FirstOrDefaultAsync(lp => lp.ProductId == productId);

        if (lp == null) return null;

        return MapToDto(lp);
    }

    public async Task<ProductLandingPageDto> SaveAsync(UpdateProductLandingPageDto dto)
    {
        var lp = await _context.ProductLandingPages
            .FirstOrDefaultAsync(lp => lp.ProductId == dto.ProductId);

        if (lp == null)
        {
            lp = new ProductLandingPage
            {
                ProductId = dto.ProductId
            };
            _context.ProductLandingPages.Add(lp);
        }

        lp.Headline = dto.Headline;
        lp.VideoUrl = dto.VideoUrl;
        lp.BenefitsTitle = dto.BenefitsTitle;
        lp.BenefitsContent = dto.BenefitsContent;
        lp.ReviewsTitle = dto.ReviewsTitle;
        lp.ReviewsImages = dto.ReviewsImages;
        lp.SideEffectsTitle = dto.SideEffectsTitle;
        lp.SideEffectsContent = dto.SideEffectsContent;
        lp.UsageTitle = dto.UsageTitle;
        lp.UsageContent = dto.UsageContent;
        lp.ThemeColor = dto.ThemeColor;
        lp.Subtitle = dto.Subtitle;
        
        _context.ProductLandingPages.Update(lp);
        await _context.SaveChangesAsync();

        return MapToDto(lp);
    }

    private static ProductLandingPageDto MapToDto(ProductLandingPage lp)
    {
        return new ProductLandingPageDto
        {
            Id = lp.Id,
            ProductId = lp.ProductId,
            Headline = lp.Headline,
            VideoUrl = lp.VideoUrl,
            BenefitsTitle = lp.BenefitsTitle,
            BenefitsContent = lp.BenefitsContent,
            ReviewsTitle = lp.ReviewsTitle,
            ReviewsImages = lp.ReviewsImages,
            SideEffectsTitle = lp.SideEffectsTitle,
            SideEffectsContent = lp.SideEffectsContent,
            UsageTitle = lp.UsageTitle,
            UsageContent = lp.UsageContent,
            ThemeColor = lp.ThemeColor,
            Subtitle = lp.Subtitle
        };
    }
}
