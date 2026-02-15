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
    private readonly ApplicationDbContext _context;

    public AdminOrdersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .AsQueryable();

        // Apply search filter
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(o => 
                o.OrderNumber.Contains(searchTerm) || 
                o.CustomerName.Contains(searchTerm));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }
        }

        // Apply date range filter
        if (!string.IsNullOrEmpty(dateRange) && dateRange != "All")
        {
            var now = DateTime.UtcNow;
            DateTime? startDate = dateRange switch
            {
                "Last 7 Days" => now.AddDays(-7),
                "Last 30 Days" => now.AddDays(-30),
                "Last 90 Days" => now.AddDays(-90),
                _ => null
            };

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            }
        }

        var total = await query.CountAsync();
        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.CustomerName,
                o.CustomerPhone,
                o.ShippingAddress,
                o.SubTotal,
                o.Tax,
                o.ShippingCost,
                o.Total,
                Status = o.Status.ToString(),
                PaymentStatus = "Paid", // Placeholder
                o.CreatedAt,
                o.UpdatedAt,
                ItemCount = o.Items.Count
            })
            .ToListAsync();

        return Ok(new { items = orders, total });
    }

    [HttpGet("filtered")]
    public async Task<ActionResult<List<object>>> GetFilteredOrders(
        [FromQuery] string? searchTerm,
        [FromQuery] string? status,
        [FromQuery] string? dateRange)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(o => 
                o.OrderNumber.Contains(searchTerm) || 
                o.CustomerName.Contains(searchTerm));
        }

        // Apply status filter
        if (!string.IsNullOrEmpty(status) && status != "All")
        {
            if (Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }
        }

        // Apply date range filter
        if (!string.IsNullOrEmpty(dateRange) && dateRange != "All")
        {
            var now = DateTime.UtcNow;
            DateTime? startDate = dateRange switch
            {
                "Last 7 Days" => now.AddDays(-7),
                "Last 30 Days" => now.AddDays(-30),
                "Last 90 Days" => now.AddDays(-90),
                _ => null
            };

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt >= startDate.Value);
            }
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.OrderNumber,
                o.CustomerName,
                o.CustomerPhone,
                o.ShippingAddress,
                o.SubTotal,
                o.Tax,
                o.ShippingCost,
                o.Total,
                Status = o.Status.ToString(),
                PaymentStatus = "Paid",
                o.CreatedAt,
                o.UpdatedAt,
                ItemCount = o.Items.Count
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetOrderById(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
            return NotFound();

        var result = new
        {
            order.Id,
            order.OrderNumber,
            order.CustomerName,
            order.CustomerPhone,
            order.ShippingAddress,
            order.SubTotal,
            order.Tax,
            order.ShippingCost,
            order.Total,
            Status = order.Status.ToString(),
            PaymentStatus = "Paid",
            order.CreatedAt,
            order.UpdatedAt,
            Items = order.Items.Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product.Name,
                ProductImage = i.Product.ImageUrl,
                i.Quantity,
                i.UnitPrice,
                Total = i.Quantity * i.UnitPrice
            }).ToList()
        };

        return Ok(result);
    }

    [HttpPut("{id}/status")]
    public async Task<ActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
            return NotFound();

        if (Enum.TryParse<OrderStatus>(dto.Status, true, out var orderStatus))
        {
            order.Status = orderStatus;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Order status updated successfully" });
        }

        return BadRequest("Invalid status");
    }
}

public class UpdateOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
}
