using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;

using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for high performance
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
    serverOptions.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    serverOptions.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(1);
    serverOptions.Limits.MaxConcurrentConnections = 100;
    serverOptions.Limits.MaxConcurrentUpgradedConnections = 100;
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = 104857600; // 100 MB
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

// Configure Serilog - Reduce logging overhead in production
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Application", "ECommerce.API")
    .CreateLogger();

builder.Host.UseSerilog();

// Optimize JSON serialization for performance
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.Strict;
        options.JsonSerializerOptions.WriteIndented = false;
        options.JsonSerializerOptions.MaxDepth = 32;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ECommerce API", Version = "v1" });
});

// Performance: Brotli + Gzip Response Compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
    options.MimeTypes = ResponseCompressionDefaults.MimeTypes.Concat(new[]
    {
        "application/json",
        "text/css",
        "application/javascript",
        "text/html",
        "image/svg+xml"
    });
});
builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Optimal;
});

// Distributed caching with in-memory for better performance
builder.Services.AddMemoryCache(options =>
{
    options.SizeLimit = 1024; // MB
    options.CompactionPercentage = 0.2;
});
builder.Services.AddResponseCaching(options =>
{
    options.MaximumBodySize = 1024 * 1024 * 10; // 10MB
    options.UseCaseSensitivePaths = false;
});

// Database with connection resiliency and performance optimizations
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"),
        sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
            sqlOptions.CommandTimeout(30);
        }
    ));

// Add distributed cache for better scalability
builder.Services.AddDistributedMemoryCache();

// JWT Setup
var jwtKey = builder.Configuration["Token:Key"] ?? "development_key_arzamart_123456789";
var keyBytes = System.Text.Encoding.UTF8.GetBytes(jwtKey);
if (keyBytes.Length < 32)
{
    using var sha256 = System.Security.Cryptography.SHA256.Create();
    keyBytes = sha256.ComputeHash(keyBytes);
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(keyBytes),
        ValidIssuer = builder.Configuration["Token:Issuer"] ?? "ArzaMart",
        ValidateIssuer = true,
        ValidAudience = builder.Configuration["Token:Audience"] ?? "ArzaMartUsers",
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Health checks for monitoring
builder.Services.AddHealthChecks();

// Register repositories and services - use transient for high-throughput scenarios
builder.Services.AddScoped<ECommerce.Core.Interfaces.IUnitOfWork, ECommerce.Infrastructure.Data.UnitOfWork>();
builder.Services.AddScoped(typeof(ECommerce.Core.Interfaces.IGenericRepository<>), typeof(ECommerce.Infrastructure.Data.GenericRepository<>));
builder.Services.AddScoped<ECommerce.Core.Interfaces.IOrderService, ECommerce.Infrastructure.Services.OrderService>();
builder.Services.AddScoped<ECommerce.Infrastructure.Services.CustomerService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IDashboardService, ECommerce.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IBlogService, ECommerce.Infrastructure.Services.BlogService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.INavigationService, ECommerce.Infrastructure.Services.NavigationService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IProductService, ECommerce.Infrastructure.Services.ProductService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IReviewService, ECommerce.Infrastructure.Services.ReviewService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IProductLandingPageService, ECommerce.Infrastructure.Services.ProductLandingPageService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Optimize HttpClient for external services
builder.Services.Configure<ECommerce.Infrastructure.Services.SteadfastSettings>(builder.Configuration.GetSection("Steadfast"));
builder.Services.AddHttpClient<ECommerce.Core.Interfaces.ISteadfastService, ECommerce.Infrastructure.Services.SteadfastService>()
    .ConfigurePrimaryHttpMessageHandler(() => new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(2),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(1),
        MaxConnectionsPerServer = 100,
        EnableMultipleHttp2Connections = true
    });
builder.Services.AddHostedService<ECommerce.Infrastructure.Services.SteadfastWorker>();

// CORS - Environment-specific configuration
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

// Ensure critical origins are always allowed (Fail-safe)
var criticalOrigins = new[] 
{ 
    "http://localhost:4200", 
    "https://localhost:4200", 
    "https://sherashopbd24.com", 
    "https://www.sherashopbd24.com" 
};

// Combine and deduplicate
allowedOrigins = allowedOrigins.Concat(criticalOrigins).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        corsBuilder =>
        {
            corsBuilder.WithOrigins(allowedOrigins)
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials()
                   .SetIsOriginAllowedToAllowWildcardSubdomains();
        });
});

var app = builder.Build();

// Swagger: Only in Development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.RoutePrefix = "swagger";
        c.DocumentTitle = "ECommerce API";
    });
}

// 1. Core security/transport
app.UseHttpsRedirection();
app.UseCors("AllowAll");

// 2. Response optimizations
app.UseResponseCompression();

// Static files with aggressive caching for production
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        var path = ctx.Context.Request.Path.Value?.ToLower() ?? "";
        
        // Cache images for 1 year (immutable)
        if (path.EndsWith(".jpg") || path.EndsWith(".jpeg") || path.EndsWith(".png") ||
            path.EndsWith(".gif") || path.EndsWith(".webp") || path.EndsWith(".svg"))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000,immutable");
            ctx.Context.Response.Headers.Append("Vary", "Accept-Encoding");
        }
        // Cache other static assets for 30 days
        else if (path.EndsWith(".css") || path.EndsWith(".js") || path.EndsWith(".woff2"))
        {
            ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000");
            ctx.Context.Response.Headers.Append("Vary", "Accept-Encoding");
        }
    }
});

// Response caching with proper vary headers
app.UseResponseCaching();

// Global exception handling - optimized for performance
app.UseSerilogRequestLogging(options =>
{
    options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
    {
        diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
        diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
    };
});

app.UseMiddleware<ECommerce.API.Middleware.GlobalExceptionMiddleware>();
app.UseMiddleware<ECommerce.API.Middleware.IpBlockingMiddleware>();
app.UseMiddleware<ECommerce.API.Middleware.VisitorTrackingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Map health checks endpoint
app.MapHealthChecks("/health");

app.MapControllers();

// Ensure Upload Directories Exist
try
{
    var uploadPaths = new[]
    {
        Path.Combine(app.Environment.WebRootPath, "uploads", "categories"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "products"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "banners"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "subcategories"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "reviews")
    };

    foreach (var path in uploadPaths)
    {
        if (!Directory.Exists(path))
        {
            Directory.CreateDirectory(path);
        }
    }
}
catch (Exception ex)
{
    Log.Error(ex, "Failed to create upload directories");
}

// Seed Data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        
        DataSeeder.SeedAsync(context).GetAwaiter().GetResult();
    }

    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration/seeding.");
    }
}

app.Run();
