using ECommerce.Core.DTOs;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost]
    public async Task<ActionResult<dynamic>> CreateOrder(OrderCreateDto orderDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (string.IsNullOrWhiteSpace(orderDto.Name))
        {
            return BadRequest(new { error = "Customer name is required" });
        }

        if (string.IsNullOrWhiteSpace(orderDto.Phone))
        {
            return BadRequest(new { error = "Phone number is required" });
        }

        if (string.IsNullOrWhiteSpace(orderDto.Address))
        {
            return BadRequest(new { error = "Shipping address is required" });
        }

        if (orderDto.Items == null || !orderDto.Items.Any())
        {
            return BadRequest(new { error = "Order must contain at least one item" });
        }

        try
        {
            var order = await _orderService.CreateOrderAsync(orderDto);
            
            // Return format expected by frontend:
            // { orderId: string, name, phone, address, deliveryDetails, itemsCount, total, createdAt }
            return Ok(new 
            {
                orderId = order.Id, // Return as numeric ID
                name = order.CustomerName,
                phone = order.CustomerPhone,
                address = order.ShippingAddress,
                deliveryDetails = order.DeliveryDetails,
                itemsCount = order.Items.Sum(i => i.Quantity),
                total = order.Total,
                createdAt = order.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders()
    {
        return Ok(await _orderService.GetOrdersAsync());
    }
}
