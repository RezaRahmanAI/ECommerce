using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Core.Caching;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using ECommerce.Core.Constants;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Microsoft.AspNetCore.OutputCaching.OutputCache(Tags = new[] { "home", "storefront" })]
public class HomeController : ControllerBase
{
    private readonly IGenericRepository<HeroBanner> _bannerRepo;
    private readonly IGenericRepository<Product> _productRepo;
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;
    private readonly IProductService _productService;

    public HomeController(
        IGenericRepository<HeroBanner> bannerRepo,
        IGenericRepository<Product> productRepo,
        IGenericRepository<Category> categoryRepo,
        IMapper mapper,
        ICacheService cache,
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
    [Microsoft.AspNetCore.OutputCaching.OutputCache(Duration = 600)]
    public async Task<ActionResult<HomePageDto>> GetHomeData()
    {
        // 1. Banners Module
        var banners = await _cache.GetOrCreateAsync(CacheConstants.BannersActive, async () =>
        {
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
        }, new CacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(60), SlidingExpiration = TimeSpan.FromMinutes(30) });

        // 2. New Arrivals Module
        var newArrivals = await _cache.GetOrCreateAsync(CacheConstants.NewArrivals, async () =>
        {
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, categorySlug: null, search: null,
                isNew: true, skip: 0, take: 10));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        }, new CacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15), SlidingExpiration = TimeSpan.FromMinutes(5) });

        // 3. Featured Products Module
        var featuredProducts = await _cache.GetOrCreateAsync(CacheConstants.FeaturedProducts, async () =>
        {
            var items = await _productRepo.ListAsync(new ProductsWithCategoriesSpecification(
                sort: "id_desc", categoryId: null, categorySlug: null, search: null,
                isNew: null, skip: 0, take: 10));
            return _mapper.Map<IReadOnlyList<Product>, IReadOnlyList<ProductListDto>>(items);
        }, new CacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15), SlidingExpiration = TimeSpan.FromMinutes(5) });

        // 4. Categories Module
        var categories = await _cache.GetOrCreateAsync(CacheConstants.CategoriesAll, async () =>
        {
            var items = await _categoryRepo.ListAsync(new CategoriesWithSubCategoriesSpec());
            return _mapper.Map<IReadOnlyList<CategoryDto>>(items);
        }, new CacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(4), SlidingExpiration = TimeSpan.FromHours(1) });

        return Ok(new HomePageDto
        {
            Banners = banners ?? new List<HeroBannerDto>(),
            NewArrivals = newArrivals ?? new List<ProductListDto>(),
            FeaturedProducts = featuredProducts ?? new List<ProductListDto>(),
            Categories = categories ?? new List<CategoryDto>()
        });
    }
}
