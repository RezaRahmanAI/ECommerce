using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ProductService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ProductDto> GetProductBySlugAsync(string slug)
    {
        var product = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.SubCategory)
            .Include(p => p.Collection)
            .Include(p => p.Images)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Slug == slug);

        if (product == null) return null;

        // Manual mapping or AutoMapper can be used. 
        // For complex logic like Variant grouping, manual mapping might be cleaner here 
        // until AutoMapper profile is set up.
        
        var dto = new ProductDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            ShortDescription = product.ShortDescription,
            Sku = product.Sku,
            Price = product.Price,
            CompareAtPrice = product.CompareAtPrice,
            PurchaseRate = product.PurchaseRate,
            StockQuantity = product.StockQuantity,
            IsActive = product.IsActive,
            IsFeatured = product.IsFeatured,
            IsNew = product.IsNew,
            
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? "",
            SubCategoryId = product.SubCategoryId,
            SubCategoryName = product.SubCategory?.Name,
            CollectionId = product.CollectionId,
            CollectionName = product.Collection?.Name,
            
            ImageUrl = product.ImageUrl,
            Images = product.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                IsPrimary = i.IsMain
            }).ToList(),
            
            Variants = product.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                Size = v.Size,
                Color = v.Color,
                Price = v.Price,
                StockQuantity = v.StockQuantity
            }).ToList(),
            
            MetaTitle = product.MetaTitle,
            MetaDescription = product.MetaDescription,
            FabricAndCare = product.FabricAndCare,
            ShippingAndReturns = product.ShippingAndReturns
        };

        return dto;
    }

    public async Task<IReadOnlyList<ProductListDto>> GetFeaturedProductsAsync()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.IsFeatured)
            .Take(8)
            .ToListAsync();

        return products.Select(p => new ProductListDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            Price = p.Price,
            CompareAtPrice = p.CompareAtPrice,
            ImageUrl = p.ImageUrl,
            CategoryName = p.Category.Name,
            IsNew = p.IsNew,
            IsFeatured = p.IsFeatured
        }).ToList();
    }
}
