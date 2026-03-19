using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class NavigationService : INavigationService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private const string MegaMenuCacheKey = "MegaMenu_v2";

    public NavigationService(ApplicationDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<MegaMenuDto> GetMegaMenuAsync()
    {
        return await _cache.GetOrCreateAsync(MegaMenuCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60);
            entry.Size = 1;

            var categories = await _context.Categories
                .AsNoTracking()
                .Include(c => c.SubCategories)
                    .ThenInclude(sc => sc.Collections)
                .Include(c => c.ChildCategories)
                    .ThenInclude(sc => sc.Collections)
                .Where(c => c.IsActive && c.ParentId == null)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            var menuDto = new MegaMenuDto
            {
                Categories = categories.Select(c => new MegaMenuCategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Slug = c.Slug,
                    Icon = c.Icon,
                    SubCategories = c.SubCategories
                        .Where(sc => sc.IsActive)
                        .Select(sc => new MegaMenuSubCategoryDto
                        {
                            Id = sc.Id,
                            Name = sc.Name,
                            Slug = sc.Slug,
                            Collections = sc.Collections
                                .Where(col => col.IsActive)
                                .OrderBy(col => col.DisplayOrder)
                                .Select(col => new MegaMenuCollectionDto
                                {
                                    Id = col.Id,
                                    Name = col.Name,
                                    Slug = col.Slug
                                }).ToList()
                        })
                        .Union(
                            c.ChildCategories
                                .Where(sc => sc.IsActive)
                                .Select(sc => new MegaMenuSubCategoryDto
                                {
                                    Id = sc.Id,
                                    Name = sc.Name,
                                    Slug = sc.Slug,
                                    Collections = sc.Collections
                                        .Where(col => col.IsActive)
                                        .OrderBy(col => col.DisplayOrder)
                                        .Select(col => new MegaMenuCollectionDto
                                        {
                                            Id = col.Id,
                                            Name = col.Name,
                                            Slug = col.Slug
                                        }).ToList()
                                })
                        )
                        .OrderBy(x => x.Name)
                        .ToList()
                }).ToList()
            };

            return menuDto;
        }) ?? new MegaMenuDto();
    }
}
