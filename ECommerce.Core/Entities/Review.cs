using System;

namespace ECommerce.Core.Entities;

public class Review : BaseEntity
{
    public string UserName { get; set; }
    public string? UserAvatar { get; set; }
    public int Rating { get; set; }
    public string Comment { get; set; }
    public bool IsVerifiedPurchase { get; set; }
    public int Likes { get; set; }
    
    public int ProductId { get; set; }
    public Product Product { get; set; }
}
