using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class NavigationService : INavigationService
{
    private readonly ApplicationDbContext _context;
    private readonly ICacheService _cache;
    private const string MegaMenuCacheKey = "nav:mega-menu";

    public NavigationService(ApplicationDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<MegaMenuDto> GetMegaMenuAsync()
    {
        return await _cache.GetOrCreateAsync(MegaMenuCacheKey, async () =>
        {
            var allCategories = await _context.Categories
                .AsNoTracking()                
                .Where(c => c.IsActive)
                .ToListAsync();

            var menuDto = new MegaMenuDto
            {
                Categories = allCategories.Select(c => new MegaMenuCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    ImageUrl = c.ImageUrl
                })
            };

            return menuDto;
        }) ?? new MegaMenuDto();
    }

    
}
