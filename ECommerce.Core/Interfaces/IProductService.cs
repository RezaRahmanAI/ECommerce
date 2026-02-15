using System.Threading.Tasks;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Specifications;

namespace ECommerce.Core.Interfaces;

public interface IProductService
{
    Task<ProductDto> GetProductBySlugAsync(string slug);
    Task<IReadOnlyList<ProductListDto>> GetFeaturedProductsAsync();
    // Add other methods as needed
}
