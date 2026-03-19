using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public string? CustomerAvatar { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; } = null!;
    public DateTime Date { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public bool IsFeatured { get; set; }
    public string? ReviewImage { get; set; }
    public int Likes { get; set; }
}

public class CreateReviewDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public string CustomerName { get; set; } = null!;

    [Range(1, 5)]
    public int Rating { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Comment { get; set; } = null!;

    public string? ReviewImage { get; set; }
}

public class ReviewUpdateDto
{
    public int Rating { get; set; }
    public string Comment { get; set; }
    public string? ReviewImage { get; set; }
}

public class PaginatedReviewsDto
{
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalItems { get; set; }
    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);
    public IReadOnlyList<ReviewDto> Reviews { get; set; } = null!;
}
