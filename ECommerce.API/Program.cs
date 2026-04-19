using ECommerce.API.Extensions;
using ECommerce.API.Middleware;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Serilog;

// ── 0. Initial Logging for Fatal Startup Errors ──────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting SheraShop API...");

    var builder = WebApplication.CreateBuilder(args);

    // ── 1. Register Services ──────────────────────────────────────────
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        try
        {
            configuration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"SERILOG CONFIG ERROR: {ex.Message}");
            configuration
                .MinimumLevel.Information()
                .Enrich.FromLogContext()
                .WriteTo.Console();
        }
    });

    // ── 2. Server Configuration ───────────────────────────────────────
    builder.WebHost.ConfigureKestrel(serverOptions =>
    {
        serverOptions.Limits.MaxRequestBodySize = 104857600; // 100 MB
    });

    builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(x =>
    {
        x.ValueLengthLimit = int.MaxValue;
        x.MultipartBodyLengthLimit = 104857600; // 100 MB
    });

    // ── 3. Services Registration ─────────────────────────────────────
    builder.Services.AddDatabaseServices(builder.Configuration);
    builder.Services.AddExoosisAuthServices(builder.Configuration);
    builder.Services.AddAppServices(builder.Configuration);
    builder.Services.AddCustomCors(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerServices(builder.Environment);

    var app = builder.Build();

    // ── 4. Middleware Pipeline ───────────────────────────────────────

    // CORS (Must be at the very top to ensure preflights and error responses have headers)
    app.UseCors("DefaultPolicy");

    // Global Exception & Logging (Absolute Top)
    app.UseAppExceptionHandling();

    // Request Timing (Right after exception handling)
    app.UseMiddleware<TimingMiddleware>();

    app.UseAppSecurityMiddleware();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }
    
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }
    app.UseResponseCompression();

    // Static Files & Media
    app.UseStaticFiles(new StaticFileOptions
    {
        OnPrepareResponse = ctx => ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=2592000,immutable")
    });
    app.ConfigureExternalMedia(builder.Configuration, builder.Environment);

    app.UseRouting();

    app.UseRateLimiter();

    app.UseAuthentication();
    app.UseAuthorization();

    // Block suspicious users
    app.UseSuspiciousUserBlocking();

    app.UseResponseCaching();
    app.UseOutputCache();


    app.MapControllers();

    // Welcome Message at root /
    app.MapGet("/", () => Results.Ok(new { message = "SheraShopBD API is running", version = "1.0.0", status = "Healthy" }));

    // ── 5. Database Seeding (Manual Migrations Required) ──────────────
    using (var scope = app.Services.CreateScope())
    {
        var sp = scope.ServiceProvider;
        var config = sp.GetRequiredService<IConfiguration>();
        var skipInit = config.GetValue<bool>("SkipDbInit");
        
        // In production, we should default to skipping migrations for performance 
        // unless explicitly requested via config.
        if (app.Environment.IsProduction() && !config.GetSection("RunMigrations").Exists())
        {
            skipInit = true;
        }

        if (skipInit)
        {
            Log.Information(">>> Skipping Database Migration and Seeding to optimize startup time.");
        }
        else
        {
            try
            {
                var context = sp.GetRequiredService<ApplicationDbContext>();
                var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = sp.GetRequiredService<RoleManager<IdentityRole>>();

                Log.Information(">>> Checking Database Migrations and Seeding...");
                // Auto-apply migrations on startup to synchronize schema
                await context.Database.MigrateAsync();
                
                // Seed data only
                await DataSeeder.SeedAsync(userManager, roleManager, context);
                Log.Information(">>> Database Synchronization Complete.");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "An error occurred during seeding.");
            }
        }
    }

    app.Run();
}
catch (HostAbortedException)
{
    throw; // Necessary for EF Core tooling
}
catch (Exception ex)
{
    Log.Fatal(ex, "SheraShop API terminated unexpectedly during startup.");
    // Ensure error is visible in stdout for IIS diagnostic
    Console.Error.WriteLine($"FATAL STARTUP ERROR: {ex.Message}");
    Console.Error.WriteLine(ex.StackTrace);
}
finally
{
    Log.CloseAndFlush();
}
