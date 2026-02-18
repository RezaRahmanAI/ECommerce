using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync();
    Task<IReadOnlyList<OrderDto>> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange);
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task<bool> UpdateOrderStatusAsync(int id, string status);
}
