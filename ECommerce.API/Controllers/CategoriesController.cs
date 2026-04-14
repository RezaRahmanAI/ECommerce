using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMemoryCache _cache;

    public CategoriesController(IGenericRepository<Category> categoryRepo, IMemoryCache cache)
    {
        _categoryRepo = categoryRepo;
        _cache = cache;
    }

    [HttpGet]
    [OutputCache(Tags = new[] { "categories" })]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        string cacheKey = CacheConstants.CategoriesActive;

        if (_cache.TryGetValue(cacheKey, out List<CategoryDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var categories = await _categoryRepo.ListAllAsync();
        
        var result = categories
            .Where(c => c.IsActive)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                ImageUrl = c.ImageUrl,
                IsActive = c.IsActive
            })
            .ToList();

        _cache.Set(cacheKey, result, new MemoryCacheEntryOptions 
        { 
            Size = 1, 
            AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1) 
        });
            
        return Ok(result);
    }
}
