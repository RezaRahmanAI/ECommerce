namespace ECommerce.Core.DTOs;

public class CategorySalesDto
{
    public string CategoryName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int OrderCount { get; set; }
}
