using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string? ReviewImage { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public bool IsApproved { get; set; }
    public int Likes { get; set; }
}

public class CreateReviewDto
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public string CustomerName { get; set; } = string.Empty;

    public string? ReviewImage { get; set; }

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; } = string.Empty;
}

public class ReviewUpdateDto
{
    public int ProductId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? ReviewImage { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; } = string.Empty;
}
