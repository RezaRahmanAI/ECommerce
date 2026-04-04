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
            // Fetch categories with full hierarchy: Parent -> Child -> Collections
            var allCategories = await _context.Categories
                .AsNoTracking()
                .Include(c => c.ChildCategories)
                    .ThenInclude(cc => cc.Collections)
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            // Top level categories are those with no parent
            var rootCategories = allCategories.Where(c => c.ParentId == null).ToList();

            var menuDto = new MegaMenuDto
            {
                Categories = rootCategories.Select(c => new MegaMenuCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Icon = c.Icon,
                    // Treat ChildCategories as "SubCategories" for the MegaMenu display on frontend
                    SubCategories = MapChildrenToSubCategories(c)
                })
            };

            return menuDto;
        }) ?? new MegaMenuDto();
    }

    private IEnumerable<MegaMenuSubCategoryDto> MapChildrenToSubCategories(Category parent)
    {
        if (parent.ChildCategories == null) return new List<MegaMenuSubCategoryDto>();

        return parent.ChildCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new MegaMenuSubCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Collections = c.Collections
                    .Where(col => col.IsActive)
                    .OrderBy(col => col.DisplayOrder)
                    .Select(col => new MegaMenuCollectionDto
                    {
                        Id = col.Id,
                        Name = col.Name,
                        Slug = col.Slug
                    })
            });
    }
}
