using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "Admin")]
public class AdminCustomersController : ControllerBase
{
    private readonly CustomerService _customerService;

    public AdminCustomersController(CustomerService customerService)
    {
        _customerService = customerService;
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
                c.CreatedAt,
                c.UpdatedAt
            }),
            total
        });
    }
}
