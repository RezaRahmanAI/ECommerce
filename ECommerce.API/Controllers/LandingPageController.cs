using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using ECommerce.Core.Interfaces;
using ECommerce.Core.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LandingPageController : ControllerBase
{
    private readonly IProductLandingPageService _service;
    private readonly IWebHostEnvironment _environment;

    public LandingPageController(IProductLandingPageService service, IWebHostEnvironment environment)
    {
        _service = service;
        _environment = environment;
    }

    [HttpGet("public/{slug}")]
    [ResponseCache(Duration = 120, VaryByHeader = "Accept-Encoding")]
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

    [Authorize(Roles = "Admin")]
    [HttpPost("upload-media")]
    [DisableRequestSizeLimit]
    [RequestFormLimits(MultipartBodyLengthLimit = 104857600)]
    public async Task<ActionResult<List<string>>> UploadMedia([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0) return BadRequest("No files uploaded");

        var uploadedUrls = new List<string>();
        var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "landing-pages");
        if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

        var tasks = new List<Task<string>>();
        
        foreach (var file in files)
        {
            if (file.Length > 0)
            {
                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                
                await using var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, true);
                await file.CopyToAsync(stream);
                uploadedUrls.Add($"/uploads/landing-pages/{fileName}");
            }
        }
        
        return Ok(uploadedUrls);
    }
}
