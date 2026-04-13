using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ECommerce.Core.Constants;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.API.Extensions;
using ECommerce.Core.Interfaces;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/settings")]
public class AdminSettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminSettingsController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config, IMemoryCache cache, IOutputCacheStore cacheStore)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<SiteSettingsDto>> GetSettings()
    {
        var settings = await _context.SiteSettings.AsNoTracking().FirstOrDefaultAsync();
        
        if (settings == null)
        {
            // Create default settings if not exists
            settings = new SiteSetting();
            _context.SiteSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(new SiteSettingsDto
        {
            WebsiteName = settings.WebsiteName,
            LogoUrl = settings.LogoUrl,
            ContactEmail = settings.ContactEmail,
            ContactPhone = settings.ContactPhone,
            Address = settings.Address,
            FacebookUrl = settings.FacebookUrl,
            InstagramUrl = settings.InstagramUrl,
            TwitterUrl = settings.TwitterUrl,
            YoutubeUrl = settings.YoutubeUrl,
            WhatsAppNumber = settings.WhatsAppNumber,
            Currency = settings.Currency,
            FreeShippingThreshold = settings.FreeShippingThreshold,
            ShippingCharge = settings.ShippingCharge,
            FacebookPixelId = settings.FacebookPixelId,
            GoogleTagId = settings.GoogleTagId,
            SizeGuideImageUrl = settings.SizeGuideImageUrl,
            DeliveryMethods = await _context.DeliveryMethods.AsNoTracking().ToListAsync(),
            ProductsUpdatedAt = settings.ProductsUpdatedAt,
            CategoriesUpdatedAt = settings.CategoriesUpdatedAt,
            BannersUpdatedAt = settings.BannersUpdatedAt,
            PagesUpdatedAt = settings.PagesUpdatedAt
        });
    }

    [HttpPost]
    public async Task<ActionResult<SiteSettingsDto>> UpdateSettings([FromBody] SiteSettingsDto dto)
    {
        var settings = await _context.SiteSettings.FirstOrDefaultAsync();
        
        if (settings == null)
        {
            settings = new SiteSetting();
            _context.SiteSettings.Add(settings);
        }

        settings.WebsiteName = dto.WebsiteName;
        settings.LogoUrl = dto.LogoUrl;
        settings.ContactEmail = dto.ContactEmail;
        settings.ContactPhone = dto.ContactPhone;
        settings.Address = dto.Address;
        settings.FacebookUrl = dto.FacebookUrl;
        settings.InstagramUrl = dto.InstagramUrl;
        settings.TwitterUrl = dto.TwitterUrl;
        settings.YoutubeUrl = dto.YoutubeUrl;
        settings.WhatsAppNumber = dto.WhatsAppNumber;
        settings.Currency = dto.Currency;
        settings.FreeShippingThreshold = dto.FreeShippingThreshold;
        settings.ShippingCharge = dto.ShippingCharge;
        settings.FacebookPixelId = dto.FacebookPixelId;
        settings.GoogleTagId = dto.GoogleTagId;
        settings.SizeGuideImageUrl = dto.SizeGuideImageUrl;
        settings.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _cache.Remove("site_settings");
        _cache.Remove("delivery_methods_active");
        _cache.Remove(CacheConstants.HomeData); // Settings can affect home (logo, shipping)
        await _cacheStore.EvictByTagAsync("settings", default);

        return Ok(dto);
    }

    [HttpPost("media")]
    public async Task<ActionResult<object>> UploadLogo(IFormFile file)
    {
        try 
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            var externalPath = FileStorageExtensions.GetExternalMediaPath(_config, _environment);
            var uploadsFolder = Path.Combine(externalPath, "settings");
            
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileExtension = Path.GetExtension(file.FileName);
            var fileName = $"logo_{DateTime.UtcNow.Ticks}{fileExtension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { url = $"/uploads/settings/{fileName}" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the settings folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during logo upload: " + ex.Message });
        }
    }

    // Delivery Methods CRUD
    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
    {
        return await _context.DeliveryMethods.AsNoTracking().ToListAsync();
    }

    [HttpPost("delivery-methods")]
    public async Task<ActionResult<DeliveryMethod>> CreateDeliveryMethod([FromBody] DeliveryMethodDto dto)
    {
        var method = new DeliveryMethod
        {
            Name = dto.Name,
            Cost = dto.Cost,
            EstimatedDays = dto.EstimatedDays,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _context.DeliveryMethods.Add(method);
        await _context.SaveChangesAsync();

        _cache.Remove("delivery_methods_active");
        await _cacheStore.EvictByTagAsync("settings", default);

        return CreatedAtAction(nameof(GetDeliveryMethods), new { id = method.Id }, method);
    }

    [HttpPost("delivery-methods/{id}")]
    public async Task<IActionResult> UpdateDeliveryMethod(int id, [FromBody] DeliveryMethodDto dto)
    {
        var method = await _context.DeliveryMethods.FindAsync(id);
        if (method == null) return NotFound();

        method.Name = dto.Name;
        method.Cost = dto.Cost;
        method.EstimatedDays = dto.EstimatedDays;
        method.IsActive = dto.IsActive;
        method.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        
        _cache.Remove("delivery_methods_active");
        await _cacheStore.EvictByTagAsync("settings", default);
        return NoContent();
    }

    [HttpPost("delivery-methods/{id}/delete")]
    public async Task<IActionResult> DeleteDeliveryMethod(int id)
    {
        var method = await _context.DeliveryMethods.FindAsync(id);
        if (method == null) return NotFound();

        _context.DeliveryMethods.Remove(method);
        await _context.SaveChangesAsync();

        _cache.Remove("delivery_methods_active");
        await _cacheStore.EvictByTagAsync("settings", default);
        return NoContent();
    }
}
