using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/banners")]
public class BannersController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly ICacheService _cache;

    public BannersController(IGenericRepository<HeroBanner> bannerRepo, ICacheService cache)
    {
        _bannerRepo = bannerRepo;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 300)]
    [OutputCache(Tags = new[] { "banners" })]
    public async Task<ActionResult<List<HeroBannerDto>>> GetActiveBanners()
    {
        string cacheKey = CacheConstants.BannersActive;

        var cached = await _cache.GetAsync<List<HeroBannerDto>>(cacheKey);
        if (cached != null)
        {
            return Ok(cached);
        }

        var spec = new HeroBannerSpecification(isActive: true);
        var banners = await _bannerRepo.ListAsync(spec);

        var bannerDtos = banners.Select(b => new HeroBannerDto
        {
            Id = b.Id,
            ImageUrl = b.ImageUrl,
            MobileImageUrl = b.MobileImageUrl ?? "",
            LinkUrl = b.LinkUrl ?? "",
            DisplayOrder = b.DisplayOrder,
            Type = b.Type
        }).ToList();

        await _cache.SetAsync(cacheKey, bannerDtos, TimeSpan.FromMinutes(10));
        return Ok(bannerDtos);
    }
}
