using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[OutputCache(Tags = new[] { "products", "inventory" })]
public class ProductsController : ControllerBase
{
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IProductService _productService;
    private readonly IMemoryCache _cache;

    public ProductsController(
        IGenericRepository<Product> productsRepo, 
        IGenericRepository<Category> categoryRepo, 
        IMapper mapper,
        IProductService productService,
        IMemoryCache cache)
    {
        _productsRepo = productsRepo;
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _productService = productService;
        _cache = cache;
    }

    [HttpGet]
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
        // Build a deterministic cache key from all query parameters
        var cacheKey = $"{CacheConstants.ProductListPrefix}_{sort}_{categoryId}_{categorySlug}_{searchTerm}_{isNew}_{pageIndex}_{pageSize}_{lastId}";

        if (_cache.TryGetValue(cacheKey, out PaginationDto<ProductDto>? cached) && cached != null)
        {
            return Ok(cached);
        }

        var skip = (pageIndex - 1) * pageSize;
        var take = pageSize;

        var spec = new ProductsWithCategoriesSpecification(sort, categoryId, categorySlug, searchTerm, isNew, skip, take, lastId);
        var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, categorySlug, searchTerm, isNew, null, null, lastId);

        var totalItems = await _productsRepo.CountAsync(countSpec);
        var dtos = await _productsRepo.ListAsync<ProductDto>(spec);
        


        var result = new PaginationDto<ProductDto>(pageIndex, pageSize, totalItems, dtos);
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(1)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

        _cache.Set(cacheKey, result, cacheOptions);
        
        return Ok(result);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var cacheKey = $"{CacheConstants.ProductDetailPrefix}_slug:{slug}";

        if (_cache.TryGetValue(cacheKey, out ProductDto? cached) && cached != null)
        {
            return Ok(cached);
        }

        var product = await _productService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        
        var cacheOptions = new MemoryCacheEntryOptions()
            .SetSize(1)
            .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

        _cache.Set(cacheKey, product, cacheOptions);
        return Ok(product);
    }

}
