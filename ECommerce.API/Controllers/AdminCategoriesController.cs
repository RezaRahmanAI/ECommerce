using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public class AdminCategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;

    public AdminCategoriesController(
        ApplicationDbContext context,
        IWebHostEnvironment environment,
        IConfiguration config)
    {
        _context = context;
        _environment = environment;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryListResponse>>> GetAll()
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Select(c => new CategoryListResponse
            {
                id = c.Id,
                name = c.Name,
                slug = c.Slug,
                parentId = c.ParentId,
                imageUrl = c.ImageUrl,
                isActive = c.IsActive,
                productCount = c.Products.Count,
                sortOrder = c.DisplayOrder
            })
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryListResponse>> GetById(int id)
    {
        var category = await _context.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        return Ok(new CategoryListResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            parentId = category.ParentId,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive,
            productCount = category.Products.Count,
            sortOrder = category.DisplayOrder
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
    public async Task<ActionResult<CategoryListResponse>> Create([FromBody] CategoryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.name))
            return BadRequest(new { message = "Category name is required" });

        var slug = string.IsNullOrWhiteSpace(request.slug) 
            ? GenerateSlug(request.name) 
            : GenerateSlug(request.slug);

        var category = new Category
        {
            Name = request.name,
            Slug = slug,
            ImageUrl = request.imageUrl,
            IsActive = request.isActive,
            DisplayOrder = request.sortOrder,
            ParentId = null
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new CategoryListResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            parentId = category.ParentId,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive,
            productCount = 0,
            sortOrder = category.DisplayOrder
        });
    }

    [HttpPut("{id:int}")]
    [HttpPost("{id:int}")]
    public async Task<ActionResult<CategoryListResponse>> Update(int id, [FromBody] CategoryCreateRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.name))
            return BadRequest(new { message = "Category name is required" });

        category.Name = request.name;
        category.Slug = string.IsNullOrWhiteSpace(request.slug) 
            ? GenerateSlug(request.name) 
            : GenerateSlug(request.slug);
        category.ImageUrl = request.imageUrl;
        category.IsActive = request.isActive;
        category.DisplayOrder = request.sortOrder;

        category.ParentId = null;

        await _context.SaveChangesAsync();

        return Ok(new CategoryListResponse
        {
            id = category.Id,
            name = category.Name,
            slug = category.Slug,
            parentId = category.ParentId,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive,
            productCount = category.Products.Count,
            sortOrder = category.DisplayOrder
        });
    }

    [HttpDelete("{id:int}")]
    [HttpPost("{id:int}/delete")]
    public async Task<ActionResult> Delete(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .Include(c => c.ChildCategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        if (category.Products.Any())
            return BadRequest(new { message = "Cannot delete category with products" });

        if (category.ChildCategories.Any())
            return BadRequest(new { message = "Cannot delete category with sub-categories" });

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("reorder")]
    public async Task<ActionResult<bool>> Reorder([FromBody] ReorderRequest request)
    {
        if (request.orderedIds == null || request.orderedIds.Count == 0)
            return BadRequest("orderedIds is required");

        var ids = request.orderedIds.ToList();

        for (int i = 0; i < ids.Count; i++)
        {
            var category = await _context.Categories.FindAsync(ids[i]);
            if (category != null)
                category.DisplayOrder = i + 1;
        }

        await _context.SaveChangesAsync();
        return Ok(true);
    }

    private static string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return string.Empty;

        var slug = Regex.Replace(name.ToLowerInvariant(), @"[^a-z0-9\s-]", "");
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');

        return slug.Length > 100 ? slug[..100].Trim('-') : slug;
    }
}

public class CategoryCreateRequest
{
    public string name { get; set; } = string.Empty;
    public string? slug { get; set; }
    public string? imageUrl { get; set; }
    public bool isActive { get; set; } = true;
    public int sortOrder { get; set; }
}

public class CategoryListResponse
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string slug { get; set; } = string.Empty;
    public int? parentId { get; set; }
    public string? imageUrl { get; set; }
    public bool isActive { get; set; }
    public int productCount { get; set; }
    public int sortOrder { get; set; }
}

public class ReorderRequest
{
    public List<int> orderedIds { get; set; } = new();
}
