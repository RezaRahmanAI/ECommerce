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
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetProducts(string? sort, int? categoryId, int? subCategoryId, int? collectionId, string? categorySlug, string? subCategorySlug, string? collectionSlug, string? searchTerm, string? tier, string? tags)
    {
        // Keeping this for now, but ideally should move to Service
        var spec = new ProductsWithCategoriesSpecification(sort, categoryId, subCategoryId, collectionId, categorySlug, subCategorySlug, collectionSlug, searchTerm, tier, tags);


        var products = await _productsRepo.ListAsync(spec);
        // Note: This mapping needs to be updated in AutoMapper profile to handle new properties
        // For now, returning basic list
        var dtos = _mapper.Map<IReadOnlyList<ProductDto>>(products);
        return Ok(dtos);
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
