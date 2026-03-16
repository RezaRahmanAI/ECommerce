using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;

namespace ECommerce.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ReviewService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<Review>> GetReviewsByProductIdAsync(int productId)
    {
        var spec = new ReviewSpecification(productId);
        return await _unitOfWork.Repository<Review>().ListAsync(spec);
    }

    public async Task<PaginatedReviewsDto> GetReviewsByProductIdAsync(int productId, int pageIndex, int pageSize)
    {
        var spec = new ReviewSpecification(productId);
        var countSpec = new BaseSpecification<Review>(r => r.ProductId == productId && r.IsApproved);
        
        var totalItems = await _unitOfWork.Repository<Review>().CountAsync(countSpec);
        
        spec.ApplyPaging((pageIndex - 1) * pageSize, pageSize);
        var reviews = await _unitOfWork.Repository<Review>().ListAsync(spec);
        
        return new PaginatedReviewsDto
        {
            PageIndex = pageIndex,
            PageSize = pageSize,
            TotalItems = totalItems,
            Reviews = _mapper.Map<IReadOnlyList<ReviewDto>>(reviews)
        };
    }

    public async Task<IEnumerable<Review>> GetFeaturedReviewsAsync()
    {
        var spec = new ReviewSpecification(isFeatured: true);
        return await _unitOfWork.Repository<Review>().ListAsync(spec);
    }

    public async Task<Review> AddReviewAsync(Review review)
    {
        // Auto-approve for now
        review.IsApproved = true; 
        review.Date = DateTime.UtcNow;
        
        _unitOfWork.Repository<Review>().Add(review);
        await _unitOfWork.Complete();
        
        return review;
    }

    public async Task<Review?> GetReviewByIdAsync(int id)
    {
        return await _unitOfWork.Repository<Review>().GetByIdAsync(id);
    }

    public async Task UpdateReviewAsync(Review review)
    {
        _unitOfWork.Repository<Review>().Update(review);
        await _unitOfWork.Complete();
    }

    public async Task DeleteReviewAsync(int id)
    {
        var review = await _unitOfWork.Repository<Review>().GetByIdAsync(id);
        if (review != null)
        {
            _unitOfWork.Repository<Review>().Delete(review);
            await _unitOfWork.Complete();
        }
    }
}
