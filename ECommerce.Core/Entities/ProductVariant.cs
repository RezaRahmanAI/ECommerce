namespace ECommerce.Core.Entities;

public class ProductVariant : BaseEntity
{
    public string? Sku { get; set; }
    public string? Size { get; set; }
    public decimal? Price { get; set; } // Override base price if set
    public int StockQuantity { get; set; }
    public bool IsActive { get; set; } = true;

    // Foreign Key
    public int ProductId { get; set; }
    public Product Product { get; set; }
}
