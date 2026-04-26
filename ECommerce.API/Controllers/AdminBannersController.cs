using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Extensions;
using ECommerce.Core.Constants;
using ECommerce.Core.Interfaces;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/banners")]
[Authorize(Roles = "Admin")]
public class AdminBannersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IImageService _imageService;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminBannersController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config, IImageService imageService, ICacheService cache, IOutputCacheStore cacheStore)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _imageService = imageService;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<HeroBannerDto>>> GetAllBanners()
    {
        var banners = await _context.HeroBanners
            .AsNoTracking()
            .OrderBy(b => b.DisplayOrder)
            .Select(b => new HeroBannerDto
            {
                Id = b.Id,
                ImageUrl = b.ImageUrl,
                MobileImageUrl = b.MobileImageUrl ?? "",
                LinkUrl = b.LinkUrl ?? "",
                DisplayOrder = b.DisplayOrder,
                Type = b.Type
            })
            .ToListAsync();

        return Ok(banners);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<HeroBannerDto>> GetBannerById(int id)
    {
        var banner = await _context.HeroBanners.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
        if (banner == null) return NotFound();

        return Ok(new HeroBannerDto
        {
            Id = banner.Id,
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        });
    }

    [HttpPost]
    public async Task<ActionResult<HeroBannerDto>> CreateBanner([FromBody] CreateHeroBannerDto dto)
    {
        var banner = new HeroBanner
        {
            ImageUrl = dto.ImageUrl,
            MobileImageUrl = dto.MobileImageUrl,
            LinkUrl = dto.LinkUrl,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive,
            Type = dto.Type
        };

        _context.HeroBanners.Add(banner);
        await _context.SaveChangesAsync();

        await InvalidateStorefrontCache();
        await _cacheStore.EvictByTagAsync("banners", default);

        return CreatedAtAction(nameof(GetBannerById), new { id = banner.Id }, new HeroBannerDto
        {
            Id = banner.Id,
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<HeroBannerDto>> UpdateBanner(int id, [FromBody] CreateHeroBannerDto dto)
    {
        var banner = await _context.HeroBanners.FindAsync(id);
        if (banner == null) return NotFound();

        banner.ImageUrl = dto.ImageUrl;
        banner.MobileImageUrl = dto.MobileImageUrl;
        banner.LinkUrl = dto.LinkUrl;
        banner.DisplayOrder = dto.DisplayOrder;
        banner.IsActive = dto.IsActive;
        banner.Type = dto.Type;
        banner.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await InvalidateStorefrontCache();
        await _cacheStore.EvictByTagAsync("banners", default);

        return Ok(new HeroBannerDto
        {
            Id = banner.Id,
            ImageUrl = banner.ImageUrl,
            MobileImageUrl = banner.MobileImageUrl ?? "",
            LinkUrl = banner.LinkUrl ?? "",
            DisplayOrder = banner.DisplayOrder,
            Type = banner.Type
        });
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteBanner(int id)
    {
        var banner = await _context.HeroBanners.FindAsync(id);
        if (banner == null) return NotFound();

        _context.HeroBanners.Remove(banner);
        await _context.SaveChangesAsync();

        await InvalidateStorefrontCache();
        await _cacheStore.EvictByTagAsync("banners", default);

        return NoContent();
    }

    [HttpPost("image")]
    public async Task<ActionResult<object>> UploadImage([FromForm] IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var url = await _imageService.ProcessAndSaveImageAsync(file.OpenReadStream(), file.FileName, "banners");
            return Ok(new { url });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the banners folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during banner image upload: " + ex.Message });
        }
    }

    private async Task InvalidateStorefrontCache()
    {
        var keysToClear = new[] 
        { 
            CacheConstants.BannersActive, 
            CacheConstants.HomeData,
            "home_banners" // Legacy compatibility
        };

        foreach (var key in keysToClear)
        {
            await _cache.RemoveAsync(key);
        }

        // Evict Output Cache
        await _cacheStore.EvictByTagAsync("banners", default);
        await _cacheStore.EvictByTagAsync("homepage", default);

        // Update Client-Side Manifest Timestamp
        var settings = await _context.SiteSettings.FirstOrDefaultAsync();
        if (settings != null)
        {
            settings.BannersUpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
    }
}
