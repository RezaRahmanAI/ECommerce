using Microsoft.AspNetCore.Mvc;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using Microsoft.AspNetCore.OutputCaching;
using System.IO;

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
    public async Task<IActionResult> GetImage(string path, [FromQuery] int? w, [FromQuery] int? h, [FromQuery] int q = 80)
    {
        if (string.IsNullOrEmpty(path)) return BadRequest();

        // 1. Resolve physical path
        string physicalPath = ResolvePhysicalPath(path);
        if (!System.IO.File.Exists(physicalPath))
        {
            _logger.LogWarning("Image not found: {PhysicalPath}", physicalPath);
            return NotFound();
        }

        // 2. Load and Detect format
        try
        {
            using var image = await Image.LoadAsync(physicalPath);
            
            // 3. Resize if requested
            if (w.HasValue || h.HasValue)
            {
                int width = w ?? 0;
                int height = h ?? 0;
                image.Mutate(x => x.Resize(new ResizeOptions
                {
                    Size = new Size(width, height),
                    Mode = ResizeMode.Max
                }));
            }

            // 4. Determine format and serve as WebP if possible
            var memoryStream = new MemoryStream();
            
            // Always prefer WebP for output
            await image.SaveAsWebpAsync(memoryStream, new SixLabors.ImageSharp.Formats.Webp.WebpEncoder
            {
                Quality = q
            });

            memoryStream.Position = 0;
            return File(memoryStream, "image/webp");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing image: {Path}", path);
            return StatusCode(500, "Internal server error during image processing");
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
        var configuredPath = _config["ExternalMediaPath"];
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return configuredPath;
        }

        var contentRoot = _env.ContentRootPath;
        var parent = Directory.GetParent(contentRoot);

        return parent != null
            ? Path.Combine(parent.FullName, "ArzaMedia")
            : Path.Combine(contentRoot, "ArzaMedia");
    }
}
