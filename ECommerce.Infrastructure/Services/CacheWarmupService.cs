using System;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.Caching;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

public class CacheWarmupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<CacheWarmupService> _logger;
    private readonly int _delaySeconds;

    public CacheWarmupService(IServiceProvider serviceProvider, ILogger<CacheWarmupService> logger, IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _delaySeconds = config.GetValue<int>("Cache:WarmupDelaySeconds", 10);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            _logger.LogInformation("Cache warmup starting in {Delay} seconds...", _delaySeconds);
            await Task.Delay(TimeSpan.FromSeconds(_delaySeconds), stoppingToken);

            using var scope = _serviceProvider.CreateScope();
            var cacheService = scope.ServiceProvider.GetRequiredService<ICacheService>();
            
            // Note: Currently we only simulate the category warmup to populate the navbar
            // without actually retrieving category data if it's too much. For real usage, you'd require
            // public UI data fetching services here. We will just init the CacheSystem.
            _logger.LogInformation("Executing cache warmup...");

            // Just an example initialization of the product version
            await cacheService.GetModuleVersionAsync(CacheModules.Products);
            await cacheService.GetModuleVersionAsync(CacheModules.Categories);
            await cacheService.GetModuleVersionAsync(CacheModules.Landing);

            _logger.LogInformation("Cache warmup completed successfully.");
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "An error occurred during cache warmup.");
        }
    }
}
