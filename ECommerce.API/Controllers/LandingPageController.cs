using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LandingPageController : ControllerBase
{
    private readonly IProductLandingPageService _service;

    public LandingPageController(IProductLandingPageService service)
    {
        _service = service;
    }
    [HttpGet("public/{slug}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any, NoStore = false)]
    public async Task<ActionResult<ProductLandingPageDto>> GetPublic(string slug)
    {
        var lp = await _service.GetByProductSlugAsync(slug);
        if (lp == null)
            return NotFound();

        return Ok(lp);
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin/{productId}")]
    public async Task<ActionResult<ProductLandingPageDto>> GetAdmin(int productId)
    {
        var lp = await _service.GetByProductIdAsync(productId);
        if (lp == null)
            return NotFound();

        return Ok(lp);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("admin")]
    public async Task<ActionResult<ProductLandingPageDto>> SaveAdmin(UpdateProductLandingPageDto dto)
    {
        var lp = await _service.SaveAsync(dto);
        return Ok(lp);
    }
}
