using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

public class NavigationController : BaseApiController
{
    private readonly INavigationService _navigationService;
    private readonly IMemoryCache _cache;

    public NavigationController(INavigationService navigationService, IMemoryCache cache)
    {
        _navigationService = navigationService;
        _cache = cache;
    }

    [HttpGet("mega-menu")]
    [ResponseCache(Duration = 600)]
    [OutputCache(Tags = new[] { "navigation", "categories" })]
    public async Task<IActionResult> GetMegaMenu()
    {
        string cacheKey = CacheConstants.NavigationMenu;

        if (_cache.TryGetValue(cacheKey, out object? cached) && cached != null)
        {
            return Ok(cached);
        }

        var menu = await _navigationService.GetMegaMenuAsync();
        _cache.Set(cacheKey, menu, new MemoryCacheEntryOptions { Size = 1, AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) });
        return Ok(menu);
    }
}
