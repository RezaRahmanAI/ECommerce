using System;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ECommerce.API.Middleware
{
    public class VisitorTrackingMiddleware
    {
        private readonly RequestDelegate _next;

        public VisitorTrackingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, IServiceProvider serviceProvider)
        {
            // Skip API calls, static files, and admin routes if you only want to track store visits
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && !path.StartsWith("/api") && !path.StartsWith("/admin") && !path.Contains("."))
            {
                using (var scope = serviceProvider.CreateScope())
                {
                    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var today = DateOnly.FromDateTime(DateTime.UtcNow);
                    
                    var traffic = await dbContext.DailyTraffics.FirstOrDefaultAsync(t => t.Date == today);
                    if (traffic == null)
                    {
                        traffic = new DailyTraffic
                        {
                            Date = today,
                            PageViews = 0,
                            UniqueVisitors = 0
                        };
                        dbContext.DailyTraffics.Add(traffic);
                    }

                    traffic.PageViews++;

                    // Check for unique visitor cookie
                    var visitorCookie = context.Request.Cookies["VisitorId"];
                    if (string.IsNullOrEmpty(visitorCookie))
                    {
                        traffic.UniqueVisitors++;
                        // Set cookie for 1 day
                        var options = new CookieOptions
                        {
                            Expires = DateTime.UtcNow.AddDays(1),
                            HttpOnly = true,
                            Secure = true,
                            SameSite = SameSiteMode.Strict
                        };
                        context.Response.Cookies.Append("VisitorId", Guid.NewGuid().ToString(), options);
                    }

                    await dbContext.SaveChangesAsync();
                }
            }

            await _next(context);
        }
    }
}
