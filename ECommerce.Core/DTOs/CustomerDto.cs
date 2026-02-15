namespace ECommerce.Core.DTOs;

public class CustomerDto
{
    public int Id { get; set; }
    public string Phone { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string? DeliveryDetails { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CustomerProfileRequest
{
    public string Phone { get; set; }
    public string Name { get; set; }
    public string Address { get; set; }
    public string? DeliveryDetails { get; set; }
}
