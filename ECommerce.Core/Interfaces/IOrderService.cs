using ECommerce.Core.DTOs;

namespace ECommerce.Core.Interfaces;

public interface IOrderService
{
    Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto, string? ipAddress = null);
    Task<IReadOnlyList<OrderDto>> GetOrdersAsync();
    Task<IReadOnlyList<OrderDto>> GetOrdersByPhoneAsync(string phone);
    Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize, DateTime? startDate = null, DateTime? endDate = null, string? sort = null, string? sortDir = "desc");
    Task<OrderDto?> GetOrderByIdAsync(int id);
    Task<bool> UpdateOrderStatusAsync(int id, string status);
}
