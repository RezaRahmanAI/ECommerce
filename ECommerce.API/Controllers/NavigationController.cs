using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

public class NavigationController : BaseApiController
{
    private readonly INavigationService _navigationService;
    private readonly ICacheService _cache;

    public NavigationController(INavigationService navigationService, ICacheService cache)
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

        var cached = await _cache.GetAsync<object>(cacheKey);
        if (cached != null)
        {
            return Ok(cached);
        }

        var menu = await _navigationService.GetMegaMenuAsync();
        await _cache.SetAsync(cacheKey, menu, TimeSpan.FromMinutes(10));
        return Ok(menu);
    }
}
