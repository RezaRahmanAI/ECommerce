using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/orders")]
[Authorize(Roles = "Admin")]
public class AdminOrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly INotificationService _notificationService;

    public AdminOrdersController(IOrderService orderService, INotificationService notificationService)
    {
        _orderService = orderService;
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, page, pageSize);
        // Ensure properties are lowercase to match frontend expectations if JSON serialization doesn't do it automatically
        return Ok(new { items, total });
    }

    [HttpGet("filtered")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetFilteredOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange)
    {
        // Fetch all matching orders for stats calculation (page 1, max size)
        var (items, _) = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange, 1, 100000);
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var success = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
        if (!success) return BadRequest(new { message = "Error updating order status" });

        // Notify about order status update
        await _notificationService.NotifyOrderStatusUpdateAsync(id, dto.Status);
        
        return Ok(new { message = "Order status updated successfully" });
    }

    [HttpPost("{id}")]
    public async Task<ActionResult> UpdateOrder(int id, [FromBody] OrderUpdateDto orderUpdateDto)
    {
        try
        {
            var success = await _orderService.UpdateOrderAsync(id, orderUpdateDto);
            if (!success) return BadRequest(new { message = "Error updating order" });

            // Notify about order update
            await _notificationService.NotifyOrderStatusUpdateAsync(id, orderUpdateDto.Status ?? "");

            return Ok(new { message = "Order updated successfully" });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
}
