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

    public AdminOrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders()
    {
        var orders = await _orderService.GetOrdersAsync();
        return Ok(orders);
    }

    [HttpGet("filtered")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetFilteredOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange)
    {
        var orders = await _orderService.GetOrdersForAdminAsync(searchTerm, status, dateRange);
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var order = await _orderService.GetOrderByIdAsync(id);
        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var success = await _orderService.UpdateOrderStatusAsync(id, dto.Status);
        if (!success) return BadRequest(new { message = "Error updating order status" });

        return Ok(new { message = "Order status updated successfully" });
    }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
}
