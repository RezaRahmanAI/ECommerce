using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/navigation")]
[Authorize(Roles = "Admin")]
public class AdminNavigationController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;

    public AdminNavigationController(ApplicationDbContext context, ICacheService cache, IOutputCacheStore cacheStore)
    {
        _context = context;
        _cache = cache;
        _cacheStore = cacheStore;
    }

    [HttpGet]
    public async Task<ActionResult<List<NavigationMenuDto>>> GetAllMenus()
    {
        var menus = await _context.NavigationMenus
            .AsNoTracking()
            .Include(m => m.ChildMenus)
            .Where(m => m.ParentMenuId == null)
            .OrderBy(m => m.DisplayOrder)
            .ToListAsync();

        return Ok(MapToDto(menus));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<NavigationMenuDto>> GetMenuById(int id)
    {
        var menu = await _context.NavigationMenus
            .AsNoTracking()
            .Include(m => m.ChildMenus)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (menu == null) return NotFound();

        return Ok(MapToDto(menu));
    }

    [HttpPost]
    public async Task<ActionResult<NavigationMenuDto>> CreateMenu([FromBody] NavigationMenuCreateDto dto)
    {
        var menu = new NavigationMenu
        {
            Title = dto.Name,
            Url = dto.Link,
            ParentMenuId = dto.ParentMenuId,
            DisplayOrder = dto.DisplayOrder,
            IsActive = dto.IsActive
        };

        _context.NavigationMenus.Add(menu);
        await _context.SaveChangesAsync();

        await InvalidateCache();

        return CreatedAtAction(nameof(GetMenuById), new { id = menu.Id }, MapToDto(menu));
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<NavigationMenuDto>> UpdateMenu(int id, [FromBody] NavigationMenuCreateDto dto)
    {
        var menu = await _context.NavigationMenus.FindAsync(id);
        if (menu == null) return NotFound();

        menu.Title = dto.Name;
        menu.Url = dto.Link;
        menu.ParentMenuId = dto.ParentMenuId;
        menu.DisplayOrder = dto.DisplayOrder;
        menu.IsActive = dto.IsActive;
        menu.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await InvalidateCache();

        return Ok(MapToDto(menu));
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteMenu(int id)
    {
        var menu = await _context.NavigationMenus.FindAsync(id);
        if (menu == null) return NotFound();

        _context.NavigationMenus.Remove(menu);
        await _context.SaveChangesAsync();

        await InvalidateCache();

        return NoContent();
    }

    private async Task InvalidateCache()
    {
        await _cache.RemoveAsync(CacheConstants.NavigationMenu);
        await _cache.RemoveAsync(CacheConstants.HomeData);
        
        await _cacheStore.EvictByTagAsync("navigation", default);
        await _cacheStore.EvictByTagAsync("homepage", default);

        // Update Manifest
        var settings = await _context.SiteSettings.FirstOrDefaultAsync();
        if (settings != null)
        {
            settings.CategoriesUpdatedAt = DateTime.UtcNow; // Navigation usually depends on categories or affects category visibility
            await _context.SaveChangesAsync();
        }
    }

    private List<NavigationMenuDto> MapToDto(IEnumerable<NavigationMenu> menus)
    {
        return menus.Select(m => MapToDto(m)).ToList();
    }

    private NavigationMenuDto MapToDto(NavigationMenu menu)
    {
        return new NavigationMenuDto
        {
            Id = menu.Id,
            Name = menu.Title ?? string.Empty,
            Link = menu.Url ?? string.Empty,
            ParentMenuId = menu.ParentMenuId,
            DisplayOrder = menu.DisplayOrder,
            IsActive = menu.IsActive,
            ChildMenus = menu.ChildMenus != null ? MapToDto(menu.ChildMenus.OrderBy(c => c.DisplayOrder)) : new List<NavigationMenuDto>()
        };
    }
}
