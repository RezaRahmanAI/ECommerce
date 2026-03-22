using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/banners")]
[ResponseCache(Duration = 300, VaryByHeader = "Accept-Encoding")]
public class BannersController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly IMemoryCache _cache;

    public BannersController(IGenericRepository<HeroBanner> bannerRepo, IMemoryCache cache)
    {
        _bannerRepo = bannerRepo;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 300)]
    public async Task<ActionResult<List<HeroBannerDto>>> GetActiveBanners()
    {
        if (_cache.TryGetValue("ActiveBanners", out List<HeroBannerDto> cachedBanners))
        {
            return Ok(cachedBanners);
        }

        var spec = new HeroBannerSpecification(isActive: true);
        var banners = await _bannerRepo.ListAsync(spec);

        var bannerDtos = banners.Select(b => new HeroBannerDto
        {
            Id = b.Id,
            Title = b.Title ?? "",
            Subtitle = b.Subtitle ?? "",
            ImageUrl = b.ImageUrl,
            MobileImageUrl = b.MobileImageUrl ?? "",
            LinkUrl = b.LinkUrl ?? "",
            ButtonText = b.ButtonText ?? "",
            DisplayOrder = b.DisplayOrder
        }).ToList();

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5))
            .SetSize(1);
        _cache.Set("ActiveBanners", bannerDtos, cacheOptions);

        return Ok(bannerDtos);
    }
}
