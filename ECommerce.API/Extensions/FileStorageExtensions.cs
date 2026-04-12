using Microsoft.Extensions.FileProviders;

namespace ECommerce.API.Extensions;

public static class FileStorageExtensions
{
    public static string ConfigureExternalMedia(this IApplicationBuilder app, IConfiguration config, IWebHostEnvironment env)
    {
        string externalMediaPath;

        try
        {
            externalMediaPath = GetExternalMediaPath(config, env);
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"WARNING: External media path resolution failed: {ex.Message}");
            externalMediaPath = Path.Combine(env.ContentRootPath, "wwwroot", "uploads");
        }

        try
        {
            if (!Directory.Exists(externalMediaPath))
            {
                Directory.CreateDirectory(externalMediaPath);
            }
            EnsureUploadDirectories(externalMediaPath);

            // If the path is outside wwwroot, we still need this. 
            // If it's inside wwwroot, standard app.UseStaticFiles() will also serve it, 
            // but this mapping ensures /uploads always works regardless of location.
            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(externalMediaPath),
                RequestPath = "/uploads",
                OnPrepareResponse = ctx =>
                {
                    ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable");
                }
            });
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"WARNING: External media static file host disabled: {ex.Message}");
        }

        return externalMediaPath;
    }

    public static string GetExternalMediaPath(IConfiguration config, IWebHostEnvironment env)
    {
        var configuredPath = config["ExternalMediaPath"];
        
        // If path is absolute, use it. If relative, combine with ContentRoot.
        if (!string.IsNullOrWhiteSpace(configuredPath))
        {
            return Path.IsPathRooted(configuredPath) 
                ? configuredPath 
                : Path.Combine(env.ContentRootPath, configuredPath);
        }

        // Default: Use wwwroot/uploads
        var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        return Path.Combine(webRoot, "uploads");
    }

    private static void EnsureUploadDirectories(string rootPath)
    {
        var uploadPaths = new[]
        {
            Path.Combine(rootPath, "categories"),
            Path.Combine(rootPath, "products"),
            Path.Combine(rootPath, "banners"),
            Path.Combine(rootPath, "subcategories"),
            Path.Combine(rootPath, "reviews"),
            Path.Combine(rootPath, "settings")
        };

        foreach (var path in uploadPaths)
        {
            if (!Directory.Exists(path))
            {
                Directory.CreateDirectory(path);
            }
        }
    }
}
