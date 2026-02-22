using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;


using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for large file uploads
builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
{
    x.ValueLengthLimit = int.MaxValue;
    x.MultipartBodyLengthLimit = 104857600; // 100 MB
    x.MultipartHeadersLengthLimit = int.MaxValue;
});

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Performance: Response Compression and Caching
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
builder.Services.AddMemoryCache();


// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => {
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Token Service
builder.Services.AddScoped<ECommerce.Core.Interfaces.ITokenService, ECommerce.Infrastructure.Services.TokenService>();

// JWT Authentication
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
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(builder.Configuration["Token:Key"]!)),
        ValidIssuer = builder.Configuration["Token:Issuer"],
        ValidateIssuer = true,
        ValidAudience = builder.Configuration["Token:Audience"],
        ValidateAudience = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = System.Security.Claims.ClaimTypes.Role // Explicitly map role claims
    };
});




builder.Services.AddScoped<ECommerce.Core.Interfaces.IUnitOfWork, ECommerce.Infrastructure.Data.UnitOfWork>();
builder.Services.AddScoped(typeof(ECommerce.Core.Interfaces.IGenericRepository<>), typeof(ECommerce.Infrastructure.Data.GenericRepository<>));
builder.Services.AddScoped<ECommerce.Core.Interfaces.IOrderService, ECommerce.Infrastructure.Services.OrderService>();
builder.Services.AddScoped<ECommerce.Infrastructure.Services.CustomerService>(); // Register CustomerService
builder.Services.AddScoped<ECommerce.Core.Interfaces.IDashboardService, ECommerce.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IBlogService, ECommerce.Infrastructure.Services.BlogService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.INavigationService, ECommerce.Infrastructure.Services.NavigationService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IProductService, ECommerce.Infrastructure.Services.ProductService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IReviewService, ECommerce.Infrastructure.Services.ReviewService>();
builder.Services.AddHttpContextAccessor(); // Add HttpContextAccessor
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Steadfast Courier
builder.Services.Configure<ECommerce.Infrastructure.Services.SteadfastSettings>(builder.Configuration.GetSection("Steadfast"));
builder.Services.AddHttpClient<ECommerce.Core.Interfaces.ISteadfastService, ECommerce.Infrastructure.Services.SteadfastService>();
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


app.UseSwagger();
 app.UseSwaggerUI();


app.UseHttpsRedirection();

app.UseResponseCompression();
app.UseStaticFiles(); // Enable serving static files from wwwroot


// Global exception handling
app.UseCors("AllowAll");

app.UseSerilogRequestLogging(); // Enable Serilog request logging
app.UseMiddleware<ECommerce.API.Middleware.GlobalExceptionMiddleware>();
app.UseMiddleware<ECommerce.API.Middleware.IpBlockingMiddleware>();
app.UseMiddleware<ECommerce.API.Middleware.VisitorTrackingMiddleware>();



app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Ensure Upload Directories Exist
try
{
    var uploadPaths = new[]
    {
        Path.Combine(app.Environment.WebRootPath, "uploads", "categories"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "products"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "banners"),
        Path.Combine(app.Environment.WebRootPath, "uploads", "subcategories")
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
        
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        DataSeeder.SeedAsync(userManager, roleManager, context).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration/seeding.");
    }
}

app.Run();
