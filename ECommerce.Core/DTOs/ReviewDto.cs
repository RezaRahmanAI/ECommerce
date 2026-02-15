using System;

namespace ECommerce.Core.DTOs;

public class ReviewDto
{
    public int Id { get; set; }
    public string UserName { get; set; }
    public string UserAvatar { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; }
    public int Likes { get; set; }
}

public class ReviewUpdateDto
{
    public int Rating { get; set; }
    public string Comment { get; set; }
}
