using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly IGenericRepository<Product> _productsRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IProductService _productService; // Injected Service

    public ProductsController(
        IGenericRepository<Product> productsRepo, 
        IGenericRepository<Category> categoryRepo, 
        IMapper mapper,
        IProductService productService)
    {
        _productsRepo = productsRepo;
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _productService = productService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginationDto<ProductDto>>> GetProducts(
        [FromQuery] string? sort, 
        [FromQuery] int? categoryId, 
        [FromQuery] int? subCategoryId, 
        [FromQuery] int? collectionId, 
        [FromQuery] string? categorySlug, 
        [FromQuery] string? subCategorySlug, 
        [FromQuery] string? collectionSlug, 
        [FromQuery] string? searchTerm, 
        [FromQuery] string? tier, 
        [FromQuery] string? tags, 
        [FromQuery] bool? isNew, 
        [FromQuery] bool? isFeatured,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 12)
    {
        var skip = (pageIndex - 1) * pageSize;
        var take = pageSize;

        var spec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured, skip, take);
        var countSpec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags, isNew, isFeatured);

        var totalItems = await _productsRepo.CountAsync(countSpec);
        var products = await _productsRepo.ListAsync(spec);
        
        var dtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);
        
        return Ok(new PaginationDto<ProductDto>(pageIndex, pageSize, totalItems, dtos));
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ProductDto>> GetProduct(string slug)
    {
        var product = await _productService.GetProductBySlugAsync(slug);
        if (product == null) return NotFound();
        return Ok(product);
    }
    


    // Removed manual JSON parsing methods as they are handled in Service

}
