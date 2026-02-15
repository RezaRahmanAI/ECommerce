namespace ECommerce.Core.Entities;

public class ProductImage : BaseEntity
{
    public string Url { get; set; }
    public string? AltText { get; set; }
    public bool IsMain { get; set; }
    public int DisplayOrder { get; set; }
    
    public int ProductId { get; set; }
    public Product Product { get; set; }
}
