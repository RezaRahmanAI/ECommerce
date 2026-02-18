using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IProductService _productService;

    public AdminProductsController(ApplicationDbContext context, IWebHostEnvironment environment, IProductService productService)
    {
        _context = context;
        _environment = environment;
        _productService = productService;
    }

    [HttpPost("media")]
    public async Task<ActionResult<List<string>>> UploadProductMedia([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0)
            return BadRequest("No files uploaded");

        var uploadedUrls = new List<string>();
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
        Directory.CreateDirectory(uploadsFolder);

        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var fileExtension = Path.GetExtension(file.FileName);
                var fileName = $"{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                uploadedUrls.Add($"/uploads/products/{fileName}");
            }
        }

        return Ok(uploadedUrls);
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetProducts(
        [FromQuery] string? searchTerm,
        [FromQuery] string? category,
        [FromQuery] string? statusTab,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(p => p.Name.Contains(searchTerm) || p.Sku.Contains(searchTerm));
        }

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(p => p.Category.Name == category);
        }

        if (!string.IsNullOrEmpty(statusTab) && statusTab != "all")
        {
            bool isActive = statusTab.ToLower() == "active";
            query = query.Where(p => p.IsActive == isActive);
        }

        var total = await query.CountAsync();
        var products = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Description,
                p.Sku,
                p.Price,
                SalePrice = p.CompareAtPrice,
                p.PurchaseRate,
                Stock = p.StockQuantity,
                Status = p.IsActive ? "Active" : "Draft",
                p.ImageUrl,
                Category = p.Category.Name,
                CategoryId = p.CategoryId,
                MediaUrls = p.Images.Select(i => i.Url).ToList(),
                p.CreatedAt
            })
            .ToListAsync();

        return Ok(new { items = products, total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetProductById(int id)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        // Result
        var result = new
        {
            product.Id,
            product.Name,
            product.Description,
            product.Sku,
            product.Price,
            SalePrice = product.CompareAtPrice,
            product.PurchaseRate,
            Stock = product.StockQuantity,
            Status = product.IsActive ? "Active" : "Draft",
            product.ImageUrl,
            Category = product.Category.Name,
            CategoryId = product.CategoryId,
            MediaUrls = product.Images.Select(i => i.Url).ToList(),
            product.CreatedAt,

            product.IsNew,
            Variants = new ProductVariantsDto
            {
               Colors = product.Images
                   .Where(i => !string.IsNullOrEmpty(i.Color))
                   .Select(i => i.Color!)
                   .Distinct()
                   .Select(c => new ProductColorDto { Name = c })
                   .ToList(),
               Sizes = product.Variants.Select(v => new ProductSizeDto { Label = v.Size ?? "", Stock = v.StockQuantity }).ToList()
            }, 
            Meta = new ProductMetaDto 
            { 
               FabricAndCare = product.FabricAndCare ?? "", 
               ShippingAndReturns = product.ShippingAndReturns ?? "" 
            }
        };
        
        return Ok(result);
    }

    private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
    };

    private ProductVariantsDto DeserializeVariantsDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductVariantsDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductVariantsDto>(json, _jsonOptions) ?? new ProductVariantsDto();
        }
        catch
        {
            return new ProductVariantsDto();
        }
    }

    private ProductMetaDto DeserializeMetaDto(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new ProductMetaDto();
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<ProductMetaDto>(json, _jsonOptions) ?? new ProductMetaDto();
        }
        catch
        {
            return new ProductMetaDto();
        }
    }

    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        try
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result == null) return BadRequest(new { message = "Error creating product" });

            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error creating product: {ex.Message}" });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        try
        {
            var result = await _productService.UpdateProductAsync(id, dto);
            if (result == null) return BadRequest(new { message = "Error updating product" });

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = $"Error updating product: {ex.Message}" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        // Delete associated images from filesystem
        if (!string.IsNullOrEmpty(product.ImageUrl))
        {
            DeleteImageFile(product.ImageUrl);
        }

        foreach (var image in product.Images)
        {
            DeleteImageFile(image.Url);
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private List<object> DeserializeVariants(string? json)
    {
        if (string.IsNullOrEmpty(json))
            return new List<object>();
        
        try
        {
            return System.Text.Json.JsonSerializer.Deserialize<List<object>>(json) ?? new List<object>();
        }
        catch
        {
            return new List<object>();
        }
    }

    private void DeleteImageFile(string imageUrl)
    {
        try
        {
            var fileName = Path.GetFileName(imageUrl);
            var filePath = Path.Combine(_environment.WebRootPath, "uploads", "products", fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
        catch
        {
            // Log error but don't fail the request
        }
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLower()
            .Replace(" ", "-")
            .Replace("?", "")
            .Replace("!", "")
            .Replace(".", "")
            .Replace(",", "")
            .Replace("'", "")
            .Replace("\"", "");
    }
}
