using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Interfaces;

public interface IReviewService
{
    Task<IEnumerable<Review>> GetReviewsByProductIdAsync(int productId);
    Task<PaginatedReviewsDto> GetReviewsByProductIdAsync(int productId, int pageIndex, int pageSize);
    Task<IEnumerable<Review>> GetFeaturedReviewsAsync();
    Task<Review> AddReviewAsync(Review review);
    Task<Review?> GetReviewByIdAsync(int id);
    Task UpdateReviewAsync(Review review);
    Task DeleteReviewAsync(int id);
}
