using System;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ECommerce.API.Middleware
{
    public class VisitorTrackingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<VisitorTrackingMiddleware> _logger;

        // Static counters — shared across all requests
        private static int _pendingPageViews = 0;
        private static int _pendingUniqueVisitors = 0;
        private static DateTime _lastFlush = DateTime.MinValue;
        private static readonly SemaphoreSlim _flushLock = new SemaphoreSlim(1, 1);

        // Flush to DB at most every 30 seconds
        private const int FlushIntervalSeconds = 30;

        public VisitorTrackingMiddleware(RequestDelegate next, ILogger<VisitorTrackingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            var path = context.Request.Path.Value?.ToLower();
            bool shouldTrack = path != null
                && !path.StartsWith("/api")
                && !path.StartsWith("/admin")
                && !path.Contains(".");

            if (shouldTrack)
            {
                var isNewVisitor = string.IsNullOrEmpty(context.Request.Cookies["VisitorId"]);

                if (isNewVisitor)
                {
                    context.Response.Cookies.Append("VisitorId", Guid.NewGuid().ToString(), new CookieOptions
                    {
                        Expires = DateTime.UtcNow.AddDays(1),
                        HttpOnly = true,
                        Secure = true,
                        SameSite = SameSiteMode.Strict
                    });
                }

                // Increment in-memory counters (thread-safe, zero DB cost)
                Interlocked.Increment(ref _pendingPageViews);
                if (isNewVisitor) Interlocked.Increment(ref _pendingUniqueVisitors);

                // Only flush to DB if 30 seconds have passed AND we can acquire the lock immediately
                bool shouldFlush = (DateTime.UtcNow - _lastFlush).TotalSeconds >= FlushIntervalSeconds;
                if (shouldFlush && await _flushLock.WaitAsync(0))
                {
                    // Capture and reset counters atomically
                    int views = Interlocked.Exchange(ref _pendingPageViews, 0);
                    int unique = Interlocked.Exchange(ref _pendingUniqueVisitors, 0);
                    _lastFlush = DateTime.UtcNow;

                    // Fire-and-forget DB write (doesn't block user response)
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            using var scope = serviceProvider.CreateScope();
                            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                            var today = DateOnly.FromDateTime(DateTime.UtcNow);

                            var traffic = await db.DailyTraffics.FirstOrDefaultAsync(t => t.Date == today);
                            if (traffic == null)
                            {
                                traffic = new DailyTraffic { Date = today, PageViews = 0, UniqueVisitors = 0 };
                                db.DailyTraffics.Add(traffic);
                            }

                            traffic.PageViews += views;
                            traffic.UniqueVisitors += unique;
                            await db.SaveChangesAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Visitor tracking flush failed. Data may be lost.");
                        }
                        finally
                        {
                            _flushLock.Release();
                        }
                    });
                }
            }

            await _next(context);
        }
    }
}
