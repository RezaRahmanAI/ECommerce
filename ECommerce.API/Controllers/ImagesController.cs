using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Microsoft.AspNetCore.OutputCaching;
using System.IO;
using ECommerce.API.Extensions;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _config;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(IWebHostEnvironment env, IConfiguration config, ILogger<ImagesController> logger)
    {
        _env = env;
        _config = config;
        _logger = logger;
    }

    [HttpGet("{**path}")]
    [OutputCache(PolicyName = "Images")]
    public async Task<IActionResult> GetImage(
        string path, 
        [FromQuery] int? w, 
        [FromQuery] int? h, 
        [FromQuery] int q = 80)
    {
        if (string.IsNullOrEmpty(path)) return BadRequest();

        // Sanitize quality
        q = Math.Clamp(q, 10, 100);

        // Resolve source file
        string physicalPath = ResolvePhysicalPath(path);
        if (!System.IO.File.Exists(physicalPath))
        {
            _logger.LogWarning("Image source not found: {PhysicalPath}", physicalPath);
            return NotFound();
        }

        // --- Disk Cache Logic ---
        var safeName = path
            .Replace("/", "_").Replace("\\", "_")
            .Replace(":", "_").Replace("..", "_");
        var cacheFileName = $"{safeName}_{w}x{h}_q{q}.webp";
        
        var cacheDir = Path.Combine(_env.WebRootPath, "_imgcache");
        Directory.CreateDirectory(cacheDir); // Creates if not exists
        var cachePath = Path.Combine(cacheDir, cacheFileName);

        // Serve from disk cache if available (< 5ms response time)
        if (System.IO.File.Exists(cachePath))
        {
            Response.Headers.Append("Cache-Control", "public, max-age=2592000, immutable");
            Response.Headers.Append("X-Cache", "HIT");
            return PhysicalFile(cachePath, "image/webp");
        }

        // Process image and write to disk cache
        try
        {
            using var image = await SixLabors.ImageSharp.Image.LoadAsync(physicalPath);

            if (w.HasValue || h.HasValue)
            {
                image.Mutate(x => x.Resize(new SixLabors.ImageSharp.Processing.ResizeOptions
                {
                    Size = new SixLabors.ImageSharp.Size(w ?? 0, h ?? 0),
                    Mode = SixLabors.ImageSharp.Processing.ResizeMode.Max
                }));
            }

            // Save to disk cache
            await image.SaveAsWebpAsync(cachePath, new SixLabors.ImageSharp.Formats.Webp.WebpEncoder
            {
                Quality = q
            });

            Response.Headers.Append("Cache-Control", "public, max-age=2592000, immutable");
            Response.Headers.Append("X-Cache", "MISS");
            return PhysicalFile(cachePath, "image/webp");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing image: {Path}", path);
            // Fall back to serving original file
            return PhysicalFile(physicalPath, "image/jpeg");
        }
    }

    private string ResolvePhysicalPath(string requestPath)
    {
        // Trim leading slashes
        requestPath = requestPath.TrimStart('/');

        // Check if it's an "uploads/" path (external media)
        if (requestPath.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase))
        {
            var relativePath = requestPath.Substring("uploads/".Length);
            var externalRoot = ResolveExternalMediaPath();
            return Path.Combine(externalRoot, relativePath);
        }

        // Otherwise, look in wwwroot
        return Path.Combine(_env.WebRootPath, requestPath);
    }

    private string ResolveExternalMediaPath()
    {
        return FileStorageExtensions.GetExternalMediaPath(_config, _env);
    }
}
