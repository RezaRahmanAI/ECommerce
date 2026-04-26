using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly ICacheService _cache;

    public CategoriesController(IGenericRepository<Category> categoryRepo, ICacheService cache)
    {
        _categoryRepo = categoryRepo;
        _cache = cache;
    }

    [HttpGet]
    [OutputCache(Tags = new[] { "categories" })]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        string cacheKey = CacheConstants.CategoriesActive;

        var cached = await _cache.GetAsync<List<CategoryDto>>(cacheKey);
        if (cached != null)
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

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromHours(1));
            
        return Ok(result);
    }
}
