using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ECommerce.Core.Constants;
using ECommerce.API.Extensions;
using ECommerce.Core.Interfaces;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;
    private readonly IConfiguration _config;
    private readonly IMemoryCache _cache;

    public AdminReviewsController(ApplicationDbContext context, IWebHostEnvironment environment, IConfiguration config, IMemoryCache cache)
    {
        _context = context;
        _environment = environment;
        _config = config;
        _cache = cache;
    }

    [HttpPost("upload-avatar")]
    public async Task<ActionResult<List<string>>> UploadReviewAvatar([FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest("No files uploaded");

            var uploadedUrls = new List<string>();
            var externalPath = FileStorageExtensions.GetExternalMediaPath(_config, _environment);
            var uploadsFolder = Path.Combine(externalPath, "reviews");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            foreach (var file in files)
            {
                if (file.Length > 0)
                {
                    var fileExtension = Path.GetExtension(file.FileName);
                    var fileName = $"{Guid.NewGuid()}{fileExtension}";
                    var filePath = Path.Combine(uploadsFolder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    uploadedUrls.Add($"/uploads/reviews/{fileName}");
                }
            }

            return Ok(uploadedUrls);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { message = "Permission denied: The server process does not have write access to the reviews folder. Error: " + ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "An error occurred during avatar upload: " + ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<ReviewDto>>> GetAllReviews()
    {
        var reviews = await _context.Reviews
            .Include(r => r.Product)
            .OrderByDescending(r => r.Date)
            .Select(r => new ReviewDto
            {
                Id = r.Id,
                CustomerName = r.CustomerName,
                CustomerAvatar = r.CustomerAvatar,
                Rating = r.Rating,
                Comment = r.Comment,
                IsVerifiedPurchase = r.IsVerifiedPurchase,
                Date = r.Date,
                ProductId = r.ProductId,
                IsFeatured = r.IsFeatured,
                Likes = r.Likes
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost]
    public async Task<ActionResult<ReviewDto>> CreateReview([FromBody] CreateReviewDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return BadRequest("Invalid ProductId");

        var review = new Review
        {
            ProductId = dto.ProductId,
            CustomerName = dto.CustomerName,
            CustomerAvatar = dto.CustomerAvatar,
            Rating = dto.Rating,
            Comment = dto.Comment,
            IsVerifiedPurchase = dto.IsVerifiedPurchase,
            IsFeatured = dto.IsFeatured,
            Date = DateTime.UtcNow,
            IsApproved = true
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();
        
        await InvalidateStorefrontCache(review.ProductId);

        return CreatedAtAction(nameof(GetAllReviews), new { id = review.Id }, new ReviewDto
        {
            Id = review.Id,
            CustomerName = review.CustomerName,
            CustomerAvatar = review.CustomerAvatar,
            Rating = review.Rating,
            Comment = review.Comment,
            IsVerifiedPurchase = review.IsVerifiedPurchase,
            Date = review.Date,
            ProductId = review.ProductId,
            ProductName = product.Headline,
            IsFeatured = review.IsFeatured,
            Likes = review.Likes
        });
    }

    [HttpPost("{id}/delete")]
    public async Task<ActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        await InvalidateStorefrontCache(review.ProductId);

        return NoContent();
    }

    [HttpPost("{id}")]
    public async Task<ActionResult<ReviewDto>> UpdateReview(int id, [FromBody] ReviewUpdateDto dto)
    {
        var review = await _context.Reviews
            .Include(r => r.Product)
            .FirstOrDefaultAsync(r => r.Id == id);
            
        if (review == null) return NotFound();

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return BadRequest("Invalid ProductId");

        review.ProductId = dto.ProductId;
        review.CustomerName = dto.CustomerName;
        review.CustomerAvatar = dto.CustomerAvatar;
        review.Rating = dto.Rating;
        review.Comment = dto.Comment;
        review.IsVerifiedPurchase = dto.IsVerifiedPurchase;
        review.IsFeatured = dto.IsFeatured;

        await _context.SaveChangesAsync();

        await InvalidateStorefrontCache(review.ProductId);

        return Ok(new ReviewDto
        {
            Id = review.Id,
            CustomerName = review.CustomerName,
            CustomerAvatar = review.CustomerAvatar,
            Rating = review.Rating,
            Comment = review.Comment,
            IsVerifiedPurchase = review.IsVerifiedPurchase,
            Date = review.Date,
            ProductId = review.ProductId,
            ProductName = product.Headline,
            Likes = review.Likes
        });
    }

    private async Task InvalidateStorefrontCache(int productId)
    {
        var keysToClear = new[] 
        { 
            CacheConstants.FeaturedReviews, 
            CacheConstants.HomeData,
            $"{CacheConstants.ProductReviewsPrefix}{productId}"
        };

        foreach (var key in keysToClear)
        {
            _cache.Remove(key);
        }
    }
}
