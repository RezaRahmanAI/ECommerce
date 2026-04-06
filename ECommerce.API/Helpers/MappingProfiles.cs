using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Enums;
using System.Linq;

namespace ECommerce.API.Helpers;

public class MappingProfiles : Profile
{
    public MappingProfiles()
    {
        // Safe mapping to prevent recursive Entity mapping crashes during DTO flattening
        CreateMap<Product, Product>().MaxDepth(1);
        CreateMap<Category, Category>().MaxDepth(1);
        
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.Images, o => o.MapFrom(s => s.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image",
                Color = i.Color
            })));

        CreateMap<Product, ProductListDto>()
            .ForMember(d => d.CategoryName, o => o.MapFrom(s => s.Category != null ? s.Category.Name : ""))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.Images.FirstOrDefault(i => i.IsMain) != null ? s.Images.FirstOrDefault(i => i.IsMain)!.Url : ""))
            .ForMember(d => d.Images, o => o.MapFrom(s => s.Images.Select(i => new ProductImageDto 
            {
                Id = i.Id,
                ImageUrl = i.Url,
                AltText = i.AltText,
                Label = i.Label,
                IsPrimary = i.IsMain,
                Type = i.MediaType ?? "image",
                Color = i.Color
            })));

        CreateMap<Category, CategoryDto>();
        CreateMap<Collection, CollectionDto>();
        
        CreateMap<Order, OrderDto>()
            .ForMember(d => d.ItemsCount, o => o.MapFrom(s => s.Items.Sum(i => i.Quantity)));

        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(d => d.ProductId, o => o.MapFrom(s => s.ProductId))
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.ProductName))
            .ForMember(d => d.UnitPrice, o => o.MapFrom(s => s.UnitPrice))
            .ForMember(d => d.Quantity, o => o.MapFrom(s => s.Quantity))
            .ForMember(d => d.Color, o => o.MapFrom(s => s.Color))
            .ForMember(d => d.Size, o => o.MapFrom(s => s.Size))
            .ForMember(d => d.ImageUrl, o => o.MapFrom(s => s.ImageUrl))
            .ForMember(d => d.TotalPrice, o => o.MapFrom(s => s.UnitPrice * s.Quantity));

        CreateMap<Review, ReviewDto>()
            .ForMember(d => d.ProductName, o => o.MapFrom(s => s.Product != null ? s.Product.Headline : ""));
        CreateMap<CreateReviewDto, Review>();


    }
}
