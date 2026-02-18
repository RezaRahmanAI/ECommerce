using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.API.Helpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.SubCategoryName, o => o.MapFrom(s => s.SubCategory != null ? s.SubCategory.Name : null))
            .ForMember(d => d.CollectionName, o => o.MapFrom(s => s.Collection != null ? s.Collection.Name : null))
            .ForMember(d => d.Images, o => o.MapFrom(s => s.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image",
                Color = i.Color
            })))
            .ForMember(d => d.Variants, o => o.MapFrom(s => s.Variants.Select(v => new ProductVariantDto
            {
                Id = v.Id,
                Sku = v.Sku,
                Size = v.Size,
                Price = v.Price,
                StockQuantity = v.StockQuantity
            })));

        CreateMap<Product, ProductListDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""));

        CreateMap<Category, CategoryDto>();
        CreateMap<SubCategory, SubCategoryDto>();
        CreateMap<Collection, CollectionDto>();
        
        CreateMap<Order, OrderDto>();
        CreateMap<OrderItem, OrderItemDto>();

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Name : ""));
        CreateMap<CreateReviewDto, Review>();
    }
}
