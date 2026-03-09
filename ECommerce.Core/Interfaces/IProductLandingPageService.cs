using System.Threading.Tasks;
using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IProductLandingPageService
{
    Task<ProductLandingPageDto?> GetByProductSlugAsync(string slug);
    Task<ProductLandingPageDto?> GetByProductIdAsync(int productId);
    Task<ProductLandingPageDto> SaveAsync(UpdateProductLandingPageDto dto);
}
