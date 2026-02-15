using ECommerce.Infrastructure.Data;
using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

// JWT Authentication
var tokenKey = builder.Configuration["Token:Key"] ?? "super_secret_key_that_is_long_enough_for_sha256";
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = key,
        ValidateIssuer = false, // Set to true in production with proper issuer
        ValidateAudience = false, // Set to true in production with proper audience
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

// Configure Identity to return 401/403 instead of redirecting to login page
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

builder.Services.AddScoped<ECommerce.Core.Interfaces.ITokenService, ECommerce.Infrastructure.Services.TokenService>();
builder.Services.AddScoped(typeof(ECommerce.Core.Interfaces.IGenericRepository<>), typeof(ECommerce.Infrastructure.Data.GenericRepository<>));
builder.Services.AddScoped<ECommerce.Infrastructure.Services.OrderService>(); // Register OrderService
builder.Services.AddScoped<ECommerce.Infrastructure.Services.CustomerService>(); // Register CustomerService
builder.Services.AddScoped<ECommerce.Core.Interfaces.IDashboardService, ECommerce.Infrastructure.Services.DashboardService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IBlogService, ECommerce.Infrastructure.Services.BlogService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.INavigationService, ECommerce.Infrastructure.Services.NavigationService>();
builder.Services.AddScoped<ECommerce.Core.Interfaces.IProductService, ECommerce.Infrastructure.Services.ProductService>();
builder.Services.AddHttpContextAccessor(); // Add HttpContextAccessor
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// CORS - Environment-specific configuration
var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() 
    ?? new[] { "http://localhost:4200" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        corsBuilder =>
        {
            corsBuilder.WithOrigins(allowedOrigins)
                   .AllowAnyMethod()
                   .AllowAnyHeader()
                   .AllowCredentials();
        });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseStaticFiles(); // Enable serving static files from wwwroot

// Global exception handling
app.UseMiddleware<ECommerce.API.Middleware.GlobalExceptionMiddleware>();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
        await DataSeeder.SeedAsync(userManager, roleManager, context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during migration/seeding.");
    }
}

app.Run();
