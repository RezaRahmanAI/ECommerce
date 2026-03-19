using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin")]
public class AdminCustomersController : ControllerBase
{
    private readonly CustomerService _customerService;
    private readonly ApplicationDbContext _context;

    public AdminCustomersController(CustomerService customerService, ApplicationDbContext context)
    {
        _customerService = customerService;
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetCustomers(
        [FromQuery] string? searchTerm,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var (items, total) = await _customerService.GetCustomersAsync(searchTerm, page, pageSize);

        return Ok(new
        {
            items = items.Select(c => new
            {
                c.Id,
                c.Name,
                c.Phone,
                c.Address,
                c.DeliveryDetails,
                c.IsSuspicious,
                c.IsBlocked,
                c.LastKnownIp,
                c.CreatedAt,
                c.UpdatedAt
            }),
            total
        });
    }

    [HttpPost("{id}/block")]
    public async Task<IActionResult> BlockCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsBlocked = true;
        await _customerService.UpdateCustomerAsync(customer);

        // Also block their last known IP if available
        if (!string.IsNullOrEmpty(customer.LastKnownIp))
        {
            var blockedIp = new BlockedIp
            {
                IpAddress = customer.LastKnownIp,
                BlockedAt = DateTime.UtcNow,
                BlockedBy = User.Identity?.Name ?? "Admin",
                Reason = $"Blocked customer: {customer.Name} ({customer.Phone})"
            };
            
            var existing = await _context.BlockedIps.AnyAsync(b => b.IpAddress == customer.LastKnownIp);
            if (!existing)
            {
                _context.BlockedIps.Add(blockedIp);
                await _context.SaveChangesAsync();
            }
        }

        return Ok();
    }

    [HttpPost("{id}/unblock")]
    public async Task<IActionResult> UnblockCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsBlocked = false;
        await _customerService.UpdateCustomerAsync(customer);

        return Ok();
    }

    [HttpPost("{id}/flag")]
    public async Task<IActionResult> FlagCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsSuspicious = true;
        await _customerService.UpdateCustomerAsync(customer);

        return Ok();
    }

    [HttpPost("{id}/unflag")]
    public async Task<IActionResult> UnflagCustomer(int id)
    {
        var customer = await _customerService.GetCustomerByIdAsync(id);
        if (customer == null) return NotFound();

        customer.IsSuspicious = false;
        await _customerService.UpdateCustomerAsync(customer);

        return Ok();
    }
}
