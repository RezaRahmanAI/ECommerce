using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HomeController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly IGenericRepository<Product> _productRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly IProductService _productService;

    public HomeController(
        IGenericRepository<HeroBanner> bannerRepo,
        IGenericRepository<Product> productRepo,
        IGenericRepository<Category> categoryRepo,
        IMapper mapper,
        IMemoryCache cache,
        IProductService productService)
    {
        _bannerRepo = bannerRepo;
        _productRepo = productRepo;
        _categoryRepo = categoryRepo;
        _mapper = mapper;
        _cache = cache;
        _productService = productService;
    }

    [HttpGet]
    [OutputCache(Tags = new[] { "homepage", "products", "categories", "banners" })]
    public async Task<ActionResult<HomePageDto>> GetHomeData()
    {
        // Execute tasks strictly sequentially. Do not create the Tasks before awaiting them, 
        // as doing so will trigger concurrent scoped DbContext executions during cache misses.
        var banners = await _cache.GetOrCreateAsync(CacheConstants.BannersActive, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(30);
            entry.Size = 1;
            var items = await _bannerRepo.ListAsync(new HeroBannerSpecification(isActive: true));
            return items.Select(b => new HeroBannerDto
            {
                Id = b.Id,
                ImageUrl = b.ImageUrl,
                MobileImageUrl = b.MobileImageUrl ?? "",
                LinkUrl = b.LinkUrl ?? "",
                DisplayOrder = b.DisplayOrder,
                Type = b.Type
            }).ToList();
        }) ?? new List<HeroBannerDto>();

        var newArrivals = await _cache.GetOrCreateAsync(CacheConstants.NewArrivals, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            entry.Size = 1;
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, categorySlug: null, search: null,
                isNew: true, skip: 0, take: 10));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        }) ?? new List<ProductListDto>();

        var featuredProducts = await _cache.GetOrCreateAsync(CacheConstants.FeaturedProducts, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(10);
            entry.Size = 1;
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, categorySlug: null, search: null,
                isNew: null, skip: 0, take: 10));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        }) ?? new List<ProductListDto>();

        var categories = await _cache.GetOrCreateAsync(CacheConstants.CategoriesAll, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromHours(1);
            entry.Size = 1;
            var items = await _categoryRepo.ListAsync(new CategoriesWithSubCategoriesSpec());
            return _mapper.Map<IReadOnlyList<CategoryDto>>(items);
        }) ?? new List<CategoryDto>();

        return Ok(new HomePageDto
        {
            Banners = banners,
            NewArrivals = newArrivals,
            FeaturedProducts = featuredProducts,
            Categories = categories
        });
    }
}
