using System;
using System.ComponentModel.DataAnnotations;

namespace ECommerce.Core.Entities;

public class Review : BaseEntity
{
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    [Required]
    public string CustomerName { get; set; } = string.Empty;

    [Range(1, 5)]
    public int Rating { get; set; }

    [MaxLength(1000)]
    public string? Comment { get; set; } = string.Empty;

    public DateTime Date { get; set; } = DateTime.UtcNow;

    public bool IsApproved { get; set; } = false;
    
    public string? ReviewImage { get; set; }

    public int Likes { get; set; } = 0;
}
