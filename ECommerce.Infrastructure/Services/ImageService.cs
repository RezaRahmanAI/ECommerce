using System;
using System.IO;
using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;

namespace ECommerce.Infrastructure.Services;

public class ImageService : IImageService
{
    private readonly IConfiguration _config;
    private readonly IHostEnvironment _env;
    private readonly string _rootPath;

    public ImageService(IConfiguration config, IHostEnvironment env)
    {
        _config = config;
        _env = env;
        _rootPath = GetExternalMediaPath();
    }

    public async Task<string> ProcessAndSaveImageAsync(Stream imageStream, string fileName, string folderName)
    {
        if (imageStream == null)
            throw new ArgumentNullException(nameof(imageStream));

        var uploadsFolder = Path.Combine(_rootPath, folderName);
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var savedFileName = $"{Guid.NewGuid()}.webp";
        var filePath = Path.Combine(uploadsFolder, savedFileName);

        using var image = await Image.LoadAsync(imageStream);
        
        // 1. Resize if too wide (Max 1200px as per blueprint)
        if (image.Width > 1200)
        {
            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(1200, 0),
                Mode = ResizeMode.Max
            }));
        }

        // 2. Save as WebP with 80% quality
        await image.SaveAsync(filePath, new WebpEncoder
        {
            Quality = 80
        });

        return $"/uploads/{folderName}/{savedFileName}";
    }

    public Task DeleteImageAsync(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl)) return Task.CompletedTask;

            // Convert URL to physical path
            var fileName = imageUrl.Replace("/uploads/", "").Replace("/", Path.DirectorySeparatorChar.ToString());
            var fullPath = Path.Combine(_rootPath, fileName);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }
        catch (Exception)
        {
            // Fail silently for deletion
        }
        return Task.CompletedTask;
    }

    private string GetExternalMediaPath()
    {
        var configuredPath = _config["ExternalMediaPath"];
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return Path.IsPathRooted(configuredPath) 
                ? configuredPath 
                : Path.Combine(_env.ContentRootPath, configuredPath);
        }

        // Default to wwwroot/uploads
        return Path.Combine(_env.ContentRootPath, "wwwroot", "uploads");
    }
}
