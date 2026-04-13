using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using ECommerce.Core.Enums;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using ECommerce.Core.Constants;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly ICacheService _cache;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper, ICacheService cache)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _cache = cache;
    }

    public async Task<ProductDto?> GetProductBySlugAsync(string slug)
    {
        var cacheKey = $"{CacheConstants.ProductDetailPrefix}:slug:{slug}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var spec = new ProductsWithCategoriesSpecification(slug);
            return await _unitOfWork.Repository<Product>().GetEntityWithSpec<ProductDto>(spec);
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> GetProductByIdAsync(int id)
    {
        var cacheKey = $"{CacheConstants.ProductDetailPrefix}:id:{id}";
        
        return await _cache.GetOrCreateAsync(cacheKey, async () => 
        {
            var spec = new ProductsWithCategoriesSpecification(id);
            return await _unitOfWork.Repository<Product>().GetEntityWithSpec<ProductDto>(spec);
        }, TimeSpan.FromMinutes(60));
    }

    public async Task<ProductDto?> CreateProductAsync(ProductCreateDto dto)
    {
        var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
        var category = await _unitOfWork.Repository<Category>().GetEntityWithSpec(categorySpec);
        
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        var product = new Product
        {
            Headline = dto.Headline,
            Subtitle = dto.Subtitle,
            StockQuantity = dto.StockQuantity,
            IsActive = dto.IsActive,
            CategoryId = category.Id,
            Price = dto.Price,
            CompareAtPrice = dto.CompareAtPrice,
            PurchaseRate = dto.PurchaseRate,
            IsNew = dto.NewArrival,
            Slug = GenerateSlug(dto.Headline),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            BenefitsTitle = dto.BenefitsTitle,
            BenefitsContent = dto.BenefitsContent,
            UsageTitle = dto.UsageTitle,
            UsageContent = dto.UsageContent,
            SideEffectsTitle = dto.SideEffectsTitle,
            SideEffectsContent = dto.SideEffectsContent
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        // Handle Images - flat array from frontend
        if (dto.Images != null && dto.Images.Count > 0)
        {
            foreach (var img in dto.Images)
            {
                product.Images.Add(new ProductImage
                {
                    Url = img.ImageUrl ?? string.Empty,
                    AltText = img.AltText,
                    IsMain = img.IsPrimary,
                    MediaType = "image"
                });
            }
        }

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null!;

        // Invalidate product lists
        await InvalidateProductCacheAsync(product);

        return _mapper.Map<Product, ProductDto>(product);
    }

    public async Task<ProductDto?> UpdateProductAsync(int id, ProductUpdateDto dto)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

        if (product == null) throw new KeyNotFoundException("Product not found");

        var oldSlug = product.Slug;
        var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
        var category = await _unitOfWork.Repository<Category>().GetEntityWithSpec<Category>(categorySpec);
        if (category == null) throw new KeyNotFoundException($"Category {dto.Category} not found");

        product.Headline = dto.Headline;
        product.Slug = GenerateSlug(dto.Headline);
        product.Subtitle = dto.Subtitle;
        product.IsActive = dto.IsActive;
        product.CategoryId = category.Id;
        product.Price = dto.Price;
        product.CompareAtPrice = dto.CompareAtPrice;
        product.PurchaseRate = dto.PurchaseRate;
        product.StockQuantity = dto.StockQuantity;
        product.IsNew = dto.NewArrival;
        
        product.BenefitsTitle = dto.BenefitsTitle;
        product.BenefitsContent = dto.BenefitsContent;
        product.UsageTitle = dto.UsageTitle;
        product.UsageContent = dto.UsageContent;
        product.SideEffectsTitle = dto.SideEffectsTitle;
        product.SideEffectsContent = dto.SideEffectsContent;

        // Sync images - flat array from frontend
        foreach (var img in product.Images.ToList()) _unitOfWork.Repository<ProductImage>().Delete(img);
        if (dto.Images != null && dto.Images.Count > 0)
        {
            foreach (var img in dto.Images)
            {
                product.Images.Add(new ProductImage
                {
                    Url = img.ImageUrl ?? string.Empty,
                    AltText = img.AltText,
                    IsMain = img.IsPrimary,
                    MediaType = "image"
                });
            }
        }

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        // Invalidate Product-specific cache and all lists
        await InvalidateProductCacheAsync(product, oldSlug);

        return _mapper.Map<Product, ProductDto>(product);
    }

    private async Task InvalidateProductCacheAsync(Product product, string? oldSlug = null)
    {
        // 1. Details Invalidation
        await _cache.RemoveAsync($"{CacheConstants.ProductDetailPrefix}:id:{product.Id}");
        await _cache.RemoveAsync($"{CacheConstants.ProductDetailPrefix}:slug:{product.Slug}");
        if (!string.IsNullOrEmpty(oldSlug) && oldSlug != product.Slug)
        {
            await _cache.RemoveAsync($"{CacheConstants.ProductDetailPrefix}:slug:{oldSlug}");
        }

        // 2. List Invalidation (Wildcard)
        await _cache.RemoveByPrefixAsync(CacheConstants.ProductListPrefix);
        
        // 3. Homepage/Section Invalidation
        await _cache.RemoveAsync(CacheConstants.FeaturedProducts);
        await _cache.RemoveAsync(CacheConstants.NewArrivals);
        await _cache.RemoveAsync(CacheConstants.HomeData); // Shared landing page data
    }

    private string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Guid.NewGuid().ToString().Substring(0, 8);

        // Convert to lowercase
        string slug = name.ToLowerInvariant();

        // Replace invalid characters with a hyphen
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");

        // Convert multiple spaces/hyphens into one
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[\s-]+", "-").Trim('-');

        // Cap length
        return slug.Length > 100 ? slug.Substring(0, 100).Trim('-') : slug;
    }

    public Task<List<string>> GetAvailableSizesAsync()
    {
        return Task.FromResult(new List<string>());
    }
}
