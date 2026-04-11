using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Interfaces;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IOutputCacheStore _cacheStore;
    private readonly ICacheService _cache;

    public AdminCategoriesController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IConfiguration config,
        IOutputCacheStore cacheStore,
        ICacheService cache)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _cacheStore = cacheStore;
        _cache = cache;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetAll()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryResponse
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                imageUrl = c.ImageUrl,
                isActive = c.IsActive
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryResponse>> GetById(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        return Ok(new CategoryResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive
        });
    }

    [HttpPost("upload-image")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest("No file uploaded");

        var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
        var uploadsFolder = Path.Combine(externalPath, "categories");
        
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var fileExtension = Path.GetExtension(file.FileName);
        var fileName = $"{Guid.NewGuid()}{fileExtension}";
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Ok(new { url = $"/uploads/categories/{fileName}" });
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.name))
            return BadRequest(new { message = "Category name is required" });

        var category = new Category
        {
            Name = request.name,
            Slug = string.IsNullOrWhiteSpace(request.slug) 
                   ? GenerateSlug(request.name) 
                   : request.slug.ToLower().Replace(" ", "-"),
            ImageUrl = request.imageUrl,
            IsActive = request.isActive
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        
        await _cacheStore.EvictByTagAsync("categories", default);
        await _cache.RemoveAsync("nav:mega-menu");

        return Ok(new CategoryResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive
        });
    }

    [HttpPost("{id:int}")]
    public async Task<ActionResult<CategoryResponse>> Update(int id, [FromBody] CategoryRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.name))
            return BadRequest(new { message = "Category name is required" });

        category.Name = request.name;
        category.Slug = string.IsNullOrWhiteSpace(request.slug) 
                        ? GenerateSlug(request.name) 
                        : request.slug.ToLower().Replace(" ", "-");
        category.ImageUrl = request.imageUrl;
        category.IsActive = request.isActive;

        await _context.SaveChangesAsync();
        
        await _cacheStore.EvictByTagAsync("categories", default);
        await _cache.RemoveAsync("nav:mega-menu");

        return Ok(new CategoryResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive
        });
    }

    [HttpPost("{id:int}/delete")]
    public async Task<ActionResult> Delete(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        if (category.Products.Any())
            return BadRequest(new { message = "Cannot delete category with products" });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        await _cacheStore.EvictByTagAsync("categories", default);
        await _cache.RemoveAsync("nav:mega-menu");

        return NoContent();
    }

    private string GenerateSlug(string name)
    {
        return name.ToLower().Trim()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("--", "-");
    }
}

public class CategoryRequest
{
    public string name { get; set; } = string.Empty;
    public string? slug { get; set; }
    public string? imageUrl { get; set; }
    public bool isActive { get; set; } = true;
}

public class CategoryResponse
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string slug { get; set; } = string.Empty;
    public string? imageUrl { get; set; }
    public bool isActive { get; set; }
}
