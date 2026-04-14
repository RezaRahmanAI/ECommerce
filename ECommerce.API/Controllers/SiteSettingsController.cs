using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/sitesettings")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMemoryCache _cache;

        public SiteSettingsController(ApplicationDbContext context, IMemoryCache cache)
        {
            _context = context;
            _cache = cache;
        }

        [HttpGet]
        [OutputCache(Tags = new[] { "settings" })]
        public async Task<ActionResult<SiteSetting>> GetSettings()
        {
            string cacheKey = CacheConstants.SiteSettings;

            if (_cache.TryGetValue(cacheKey, out SiteSetting? cached) && cached != null)
            {
                return Ok(cached);
            }

            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            
            if (settings == null)
            {
                settings = new SiteSetting();
            }

            _cache.Set(cacheKey, settings, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        [OutputCache(Tags = new[] { "settings" })]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            string cacheKey = CacheConstants.DeliveryMethodsActive;

            if (_cache.TryGetValue(cacheKey, out IEnumerable<DeliveryMethod>? cached) && cached != null)
            {
                return Ok(cached);
            }

            var methods = await _context.DeliveryMethods
                .Where(m => m.IsActive)
                .ToListAsync();

            _cache.Set(cacheKey, methods, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
            return Ok(methods);
        }
    }
}
