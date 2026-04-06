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
                imageUrl = c.ImageUrl,
                isActive = c.IsActive
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
    public async Task<ActionResult<CategoryListResponse>> Create([FromBody] CategoryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.name))
            return BadRequest(new { message = "Category name is required" });

        var category = new Category
        {
            Name = request.name,
            Slug = GenerateSlug(request.name),
            Icon = null,
            ImageUrl = request.imageUrl,
            MetaTitle = null,
            MetaDescription = null,
            IsActive = request.isActive,
            DisplayOrder = 0,
            ParentId = null
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new CategoryListResponse
        {
            id = category.Id,
            name = category.Name,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive
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
        category.Slug = GenerateSlug(request.name);
        category.Icon = null;
        category.ImageUrl = request.imageUrl;
        category.MetaTitle = null;
        category.MetaDescription = null;
        category.IsActive = request.isActive;
        category.ParentId = null;
        category.DisplayOrder = 0;

        await _context.SaveChangesAsync();

        return Ok(new CategoryListResponse
        {
            id = category.Id,
            name = category.Name,
            imageUrl = category.ImageUrl,
            isActive = category.IsActive
        });
    }

    [HttpDelete("{id:int}")]
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

        return NoContent();
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
    public string? imageUrl { get; set; }
    public bool isActive { get; set; } = true;
}

public class CategoryListResponse
{
    public int id { get; set; }
    public string name { get; set; } = string.Empty;
    public string? imageUrl { get; set; }
    public bool isActive { get; set; }
}
