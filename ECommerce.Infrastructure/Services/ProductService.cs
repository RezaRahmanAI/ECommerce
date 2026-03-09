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

namespace ECommerce.Infrastructure.Services;

public class ProductService : IProductService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ProductService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ProductDto> GetProductBySlugAsync(string slug)
    {
        var spec = new ProductsWithCategoriesSpecification(slug);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

        if (product == null) return null;

        return _mapper.Map<Product, ProductDto>(product);
    }




    public async Task<ProductDto> GetProductByIdAsync(int id)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

        if (product == null) return null;

        return _mapper.Map<Product, ProductDto>(product);
    }

    public async Task<ProductDto> CreateProductAsync(ProductCreateDto dto)
    {
        Category category = null;
        if (!string.IsNullOrEmpty(dto.Category))
        {
            var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
            category = await _unitOfWork.Repository<Category>().GetEntityWithSpec(categorySpec);
        }

        if (category == null)
        {
            // Fallback to first available category
            category = (await _unitOfWork.Repository<Category>().ListAllAsync()).FirstOrDefault();
        }
        
        if (category == null) throw new KeyNotFoundException($"No categories found in system. Please create a category first.");

        var product = new Product
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            CompareAtPrice = dto.SalePrice,
            PurchaseRate = dto.PurchaseRate > 0 ? dto.PurchaseRate : dto.Price,
            StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory),
            IsActive = dto.StatusActive,
            CategoryId = category.Id,
            ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty,

            IsNew = dto.NewArrival,
            IsFeatured = dto.IsFeatured,
            IsItemProduct = dto.IsItemProduct,
            Slug = GenerateSlug(dto.Name),
            Sku = $"PRD-{DateTime.UtcNow.Ticks}",
            FabricAndCare = dto.Meta?.FabricAndCare,
            ShippingAndReturns = dto.Meta?.ShippingAndReturns,

            // New fields
            Tier = dto.Tier,
            Tags = dto.Tags,
            SortOrder = dto.SortOrder,
            SubCategoryId = dto.SubCategoryId,
            CollectionId = dto.CollectionId
        };

        _unitOfWork.Repository<Product>().Add(product);
        
        // Handle Images
        if (dto.Media?.MainImage != null)
        {
            product.Images.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true,
                Color = dto.Media.MainImage.Color
            });
        }

        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            product.Images.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false,
                Color = thumb.Color
            });
        }

        // Handle Variants — each variant = one size with its own stock
        foreach (var v in dto.InventoryVariants)
        {
            product.Variants.Add(new ProductVariant {
                Sku = v.Sku,
                Price = v.Price,
                StockQuantity = v.Inventory,
                Size = v.Label
            });
        }

        var result = await _unitOfWork.Complete();
        if (result <= 0) return null;

        return _mapper.Map<Product, ProductDto>(product);
    }

    public async Task<ProductDto> UpdateProductAsync(int id, ProductUpdateDto dto)
    {
        var spec = new ProductsWithCategoriesSpecification(id);
        var product = await _unitOfWork.Repository<Product>().GetEntityWithSpec(spec);

        if (product == null) throw new KeyNotFoundException("Product not found");

        Category category = null;
        if (!string.IsNullOrEmpty(dto.Category))
        {
            var categorySpec = new CategoriesWithSubCategoriesSpec(dto.Category);
            category = await _unitOfWork.Repository<Category>().GetEntityWithSpec(categorySpec);
        }

        if (category == null)
        {
            // Maintain current category if none provided and no fallback needed, 
            // or fallback to first available if product currently has no category (unlikely)
            category = product.Category ?? (await _unitOfWork.Repository<Category>().ListAllAsync()).FirstOrDefault();
        }

        if (category == null) throw new KeyNotFoundException($"Category context could not be resolved.");

        // Update basic props
        product.Name = dto.Name;
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.CompareAtPrice = dto.SalePrice;
        product.PurchaseRate = dto.PurchaseRate > 0 ? dto.PurchaseRate : (product.PurchaseRate ?? dto.Price);
        product.IsActive = dto.StatusActive;
        product.CategoryId = category.Id;
        product.ImageUrl = dto.Media?.MainImage?.ImageUrl ?? string.Empty;

        product.IsNew = dto.NewArrival;
        product.IsFeatured = dto.IsFeatured;
        product.IsItemProduct = dto.IsItemProduct;
        product.FabricAndCare = dto.Meta?.FabricAndCare;
        product.ShippingAndReturns = dto.Meta?.ShippingAndReturns;

        // New fields
        product.Tier = dto.Tier;
        product.Tags = dto.Tags;
        product.SortOrder = dto.SortOrder;
        product.SubCategoryId = dto.SubCategoryId;
        product.CollectionId = dto.CollectionId;

        // Sync images - Add/Update/Delete instead of bulk delete
        var dtoImages = new List<ProductImage>();
        if (dto.Media?.MainImage != null)
        {
            dtoImages.Add(new ProductImage {
                Url = dto.Media.MainImage.ImageUrl ?? string.Empty,
                AltText = dto.Media.MainImage.Alt,
                Label = dto.Media.MainImage.Label,
                MediaType = dto.Media.MainImage.Type ?? "image",
                IsMain = true,
                Color = dto.Media.MainImage.Color
            });
        }
        foreach (var thumb in dto.Media?.Thumbnails ?? new())
        {
            dtoImages.Add(new ProductImage {
                Url = thumb.ImageUrl ?? string.Empty,
                AltText = thumb.Alt,
                Label = thumb.Label,
                MediaType = thumb.Type ?? "image",
                IsMain = false,
                Color = thumb.Color
            });
        }

        // Simple sync: remove what's not in DTO, add new ones (simplified for this context)
        // Ideally we match by ID or URL to update instead of delete.
        // For brevity and safety, we match by URL.
        var currentImages = product.Images.ToList();
        foreach (var img in currentImages)
        {
            if (!dtoImages.Any(di => di.Url == img.Url))
            {
                _unitOfWork.Repository<ProductImage>().Delete(img);
                product.Images.Remove(img);
            }
        }
        foreach (var di in dtoImages)
        {
            if (!currentImages.Any(ci => ci.Url == di.Url))
            {
                product.Images.Add(di);
            }
        }

        // Sync variants
        var dtoVariants = dto.InventoryVariants.Select(v => new ProductVariant {
            Sku = v.Sku,
            Price = v.Price,
            StockQuantity = v.Inventory,
            Size = v.Label
        }).ToList();

        var currentVariants = product.Variants.ToList();
        foreach (var v in currentVariants)
        {
            var matchedDto = dtoVariants.FirstOrDefault(dv => dv.Sku == v.Sku);
            if (matchedDto == null)
            {
                _unitOfWork.Repository<ProductVariant>().Delete(v);
                product.Variants.Remove(v);
            }
            else
            {
                v.Price = matchedDto.Price;
                v.StockQuantity = matchedDto.StockQuantity;
                v.Size = matchedDto.Size;
                _unitOfWork.Repository<ProductVariant>().Update(v);
            }
        }
        foreach (var dv in dtoVariants)
        {
            if (!currentVariants.Any(cv => cv.Sku == dv.Sku))
            {
                product.Variants.Add(dv);
            }
        }

        // Recalculate total stock from variants
        product.StockQuantity = dto.InventoryVariants.Sum(v => v.Inventory);

        _unitOfWork.Repository<Product>().Update(product);
        await _unitOfWork.Complete();

        return _mapper.Map<Product, ProductDto>(product);
    }

    private string GenerateSlug(string name)
    {
        return name.ToLower().Trim().Replace(" ", "-").Replace("/", "-");
    }
}
