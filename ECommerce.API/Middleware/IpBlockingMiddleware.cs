using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Net;

namespace ECommerce.API.Middleware;

public class IpBlockingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<IpBlockingMiddleware> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public IpBlockingMiddleware(RequestDelegate next, ILogger<IpBlockingMiddleware> logger, IServiceScopeFactory scopeFactory)
    {
        _next = next;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();

        if (!string.IsNullOrEmpty(ipAddress))
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                
                // Check if IP is blocked
                // Note: In a high-traffic production scenario, you'd want to cache this check (e.g., MemoryCache or Redis) 
                // to avoid a DB hit on every request. For this scale, DB check is acceptable.
                var isBlocked = await dbContext.BlockedIps.AnyAsync(b => b.IpAddress == ipAddress);

                if (isBlocked)
                {
                    _logger.LogWarning($"Blocked request from IP: {ipAddress}");
                    context.Response.StatusCode = (int)HttpStatusCode.Forbidden;
                    await context.Response.WriteAsync("Access Denied: Your IP address has been blocked.");
                    return;
                }
            }
        }

        await _next(context);
    }
}
