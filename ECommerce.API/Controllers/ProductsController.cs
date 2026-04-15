using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using ECommerce.Core.Constants;
using ECommerce.Core.Caching;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IProductService _productService;
    private readonly ICacheService _cache;

    public ProductsController(
        IGenericRepository<Product> productsRepo, 
        IGenericRepository<Category> categoryRepo, 
        IMapper mapper,
        IProductService productService,
        ICacheService cache)
    {
        _productsRepo = productsRepo;
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _productService = productService;
        _cache = cache;
    }

    [HttpGet]
    [ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "*" })]
    public async Task<ActionResult<PaginationDto<ProductDto>>> GetProducts(
        [FromQuery] string? sort, 
        [FromQuery] int? categoryId, 
        [FromQuery] string? categorySlug, 
        [FromQuery] string? searchTerm, 
        [FromQuery] bool? isNew, 
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 12,
        [FromQuery] int? lastId = null)
    {
        var version = await _cache.GetModuleVersionAsync(CacheModules.Products);
        // Clean cache key helper
        var keyParts = $"sort_{sort}_cat_{categoryId}_{categorySlug}_search_{searchTerm}_new_{isNew}_p_{pageIndex}_size_{pageSize}_last_{lastId}";
        var cacheKey = CacheKeyHelper.ProductListing(categoryId ?? 0, pageIndex, keyParts, version);

        var result = await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var skip = (pageIndex - 1) * pageSize;
            var take = pageSize;

            var spec = new ProductsWithCategoriesSpecification(sort, categoryId, categorySlug, searchTerm, isNew, skip, take, lastId);
            var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, categorySlug, searchTerm, isNew, null, null, lastId);

            var totalItems = await _productsRepo.CountAsync(countSpec);
            var dtos = await _productsRepo.ListAsync<ProductDto>(spec);
            
            return new PaginationDto<ProductDto>(pageIndex, pageSize, totalItems, dtos);
        }, new CacheEntryOptions {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
            Size = 1
        });
        
        return Ok(result);
    }

    [HttpGet("{slug}")]
    [ResponseCache(Duration = 60, VaryByQueryKeys = new[] { "*" })]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        // Service already handles memory caching with GetProductBySlugAsync natively
        var product = await _productService.GetProductBySlugAsync(slug);
        
        if (product == null) return NotFound();
        return Ok(product);
    }
}
