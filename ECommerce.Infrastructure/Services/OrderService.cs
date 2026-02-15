using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class OrderService
{
    private readonly ApplicationDbContext _context;
    private readonly CustomerService _customerService;

    public OrderService(ApplicationDbContext context, CustomerService customerService)
    {
        _context = context;
        _customerService = customerService;
    }

    public async Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto)
    {
        // Use transaction to ensure data consistency
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var items = new List<OrderItem>();
            
            foreach (var itemDto in orderDto.Items)
            {
                var product = await _context.Products.FindAsync(itemDto.ProductId);
                
                if (product == null)
                {
                    throw new Exception($"Product with ID {itemDto.ProductId} not found");
                }
                
                // CRITICAL: Validate stock availability
                if (product.StockQuantity < itemDto.Quantity)
                {
                    throw new Exception($"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, Requested: {itemDto.Quantity}");
                }
                
                // CRITICAL: Decrease stock
                product.StockQuantity -= itemDto.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
                
                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    UnitPrice = product.Price, // Use backend price for security
                    Quantity = itemDto.Quantity,
                    Color = itemDto.Color,
                    Size = itemDto.Size,
                    ImageUrl = product.ImageUrl
                };
                
                items.Add(orderItem);
            }

            var subtotal = items.Sum(i => i.TotalPrice);
            
            // Fetch shipping settings
            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            var freeShippingThreshold = settings?.FreeShippingThreshold ?? 5000;
            var shippingCharge = settings?.ShippingCharge ?? 120;

            var order = new Order
            {
                OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
                CustomerName = orderDto.Name,
                CustomerPhone = orderDto.Phone,
                ShippingAddress = orderDto.Address,
                DeliveryDetails = orderDto.DeliveryDetails,
                Items = items,
                SubTotal = subtotal,
                Tax = subtotal * 0.08m, // TODO: Make configurable
                ShippingCost = subtotal >= freeShippingThreshold ? 0 : shippingCharge,
                Status = OrderStatus.Confirmed
            };
            
            order.Total = order.SubTotal + order.Tax + order.ShippingCost;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Auto-create/update customer profile
            await _customerService.CreateOrUpdateCustomerAsync(
                orderDto.Phone,
                orderDto.Name,
                orderDto.Address,
                orderDto.DeliveryDetails
            );
            
            // Commit transaction
            await transaction.CommitAsync();

            return MapToDto(order);
        }
        catch
        {
            // Rollback on any error
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<List<OrderDto>> GetOrdersAsync()
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
            
        return orders.Select(MapToDto).ToList();
    }

    private OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            ShippingAddress = order.ShippingAddress,
            DeliveryDetails = order.DeliveryDetails,
            Total = order.Total,
            Status = order.Status.ToString(),
            CreatedAt = order.CreatedAt,
            Items = order.Items.Select(i => new OrderItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.ProductName,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice,
                Color = i.Color,
                Size = i.Size,
                ImageUrl = i.ImageUrl
            }).ToList()
        };
    }
}
