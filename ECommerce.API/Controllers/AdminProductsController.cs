using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Core.Specifications;
using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

using Microsoft.AspNetCore.OutputCaching;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/products")]
[Authorize(Roles = "Admin")]
public class AdminProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IProductService _productService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _config;
    private readonly ICacheService _cache;
    private readonly IOutputCacheStore _cacheStore;
    private readonly INotificationService _notificationService;

    public AdminProductsController(ApplicationDbContext context, IWebHostEnvironment environment, IProductService productService, IUnitOfWork unitOfWork, IConfiguration config, ICacheService cache, IOutputCacheStore cacheStore, INotificationService notificationService)
    {
        _context = context;
        _environment = environment;
        _productService = productService;
        _unitOfWork = unitOfWork;
        _config = config;
        _cache = cache;
        _cacheStore = cacheStore;
        _notificationService = notificationService;
    }

    [HttpPost("upload-media")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<List<string>>> UploadProductMedia([FromForm] List<IFormFile> files)
    {
        try 
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            var uploadedUrls = new List<string>();
            var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            var uploadsFolder = Path.Combine(externalPath, "products");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

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
        catch (UnauthorizedAccessException ex)
        {
             return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the products folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during product media upload: " + ex.Message });
        }
    }

    [HttpGet("available-sizes")]
    public async Task<ActionResult<List<string>>> GetAvailableSizes()
    {
        var sizes = await _productService.GetAvailableSizesAsync();
        return Ok(sizes);
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
            .AsNoTracking()
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(p => p.Headline.Contains(searchTerm) || p.Sku.Contains(searchTerm));
        }

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(p => p.Category != null && p.Category.Name == category);
        }

        if (!string.IsNullOrEmpty(statusTab) && statusTab != "all")
        {
            bool isActive = statusTab.ToLower() == "active";
            query = query.Where(p => p.IsActive == isActive);
        }

        var total = await query.CountAsync();
        var products = await query
            .Include(p => p.Category)
            .Include(p => p.Images)
            .AsSplitQuery()
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new
            {
                p.Id,
                Name = p.Headline,
                p.Headline,
                p.Subtitle,
                p.Sku,
                p.Price,
                SalePrice = p.CompareAtPrice,
                p.PurchaseRate,
                p.StockQuantity,
                p.IsNew,
                Status = p.IsActive ? "Active" : "Draft",
                imgUrl = p.Images.FirstOrDefault(i => i.IsMain) != null ? p.Images.FirstOrDefault(i => i.IsMain)!.Url : "",
                Category = p.Category != null ? p.Category.Name : "",
                CategoryId = p.CategoryId,
                MediaUrls = p.Images.Select(i => i.Url).ToList(),
                p.CreatedAt,
                p.Slug
            })
            .ToListAsync();

        return Ok(new { items = products, total });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProductById(int id)
    {
        var product = await _productService.GetProductByIdAsync(id);

        if (product == null) return NotFound();

        return Ok(product);
    }

    private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
    };



    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateDto dto)
    {
        try
        {
            var result = await _productService.CreateProductAsync(dto);
            if (result == null) return BadRequest(new { message = "Error creating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("products", default);

            // Notify clients about new product
            await _notificationService.NotifyProductUpdateAsync("create", result.Id);

            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, result);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[ADMIN_ERROR] Error creating product: {ex.Message}");
            Console.WriteLine($"[ADMIN_ERROR] StackTrace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"[ADMIN_ERROR] InnerException: {ex.InnerException.Message}");
            }
            return StatusCode(500, new { message = $"Error creating product: {ex.Message}" });
        }
    }

    [HttpPost("{id}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
    {
        try
        {
            Console.WriteLine($"[ADMIN_DEBUG] Updating Product {id}: {dto.Headline}");
            var result = await _productService.UpdateProductAsync(id, dto);
            if (result == null) return BadRequest(new { message = "Error updating product" });

            await _cache.RemoveAsync("home_new_arrivals");
            await _cache.RemoveAsync("home_featured_products");
            await _cacheStore.EvictByTagAsync("products", default);

            // Notify clients about product update
            await _notificationService.NotifyProductUpdateAsync("update", id);

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

    [HttpPost("{id:int}/delete")]
    public async Task<ActionResult<bool>> DeleteProduct(int id)
    {
        var product = await _context.Products
            .Include(p => p.Images)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound();

        // Delete associated images from filesystem
        foreach (var image in product.Images)
        {
            DeleteImageFile(image.Url);
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        await _cache.RemoveAsync("home_new_arrivals");
        await _cache.RemoveAsync("home_featured_products");
        await _cacheStore.EvictByTagAsync("products", default);

        return Ok(true);
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
            var externalPath = _config["ExternalMediaPath"] ?? Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads");
            var filePath = Path.Combine(externalPath, "products", fileName);
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
    [HttpGet("inventory")]
    public async Task<ActionResult<List<ProductInventoryDto>>> GetInventory()
    {
        var spec = new BaseSpecification<Product>();
        var products = await _unitOfWork.Repository<Product>().ListAsync(spec);

        var inventory = products.Select(p => new ProductInventoryDto
        {
            ProductId = p.Id,
            ProductName = p.Headline,
            ProductSku = p.Sku ?? string.Empty,
            ImageUrl = p.Images?.FirstOrDefault(i => i.IsMain)?.Url ?? string.Empty,
            TotalStock = p.StockQuantity,
            Variants = new List<VariantInventoryDto>() // Return empty for legacy frontend compat
        }).ToList();

        return Ok(inventory);
    }

    [HttpPost("inventory/{productId}")]
    public async Task<ActionResult> UpdateStock(int productId, UpdateStockDto dto)
    {
        var product = await _unitOfWork.Repository<Product>().GetByIdAsync(productId);
        if (product == null) return NotFound(new { message = "Product not found" });
        
        product.StockQuantity = dto.Quantity;
        _unitOfWork.Repository<Product>().Update(product);

        if (await _unitOfWork.Complete() > 0)
        {
             // Invalidate cache
             await _cache.RemoveAsync("home_new_arrivals");
             await _cache.RemoveAsync("home_featured_products");
             await _cacheStore.EvictByTagAsync("products", default);
             
             var cacheKeys = new[] { $"product_id:{product.Id}", $"product_slug:{product.Slug}" };
             foreach (var key in cacheKeys)
             {
                 await _cache.RemoveAsync(key);
             }

             // Notify clients about stock update
             await _notificationService.NotifyProductUpdateAsync("stock", product.Id);

             return Ok(new { message = "Stock updated successfully", newTotal = product.StockQuantity });
        }

        return BadRequest(new { message = "Failed to update stock" });
    }
}
