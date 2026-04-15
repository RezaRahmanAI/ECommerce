using System;
using System.Threading.Tasks;
using ECommerce.Core.Caching; // Added namespace for CacheEntryOptions

namespace ECommerce.Core.Interfaces;

/// <summary>
/// Provides production-grade caching with stampede protection and memory limits.
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null);
    Task RemoveAsync(string key);
    Task RemoveByPrefixAsync(string prefix);
    
    /// <summary>
    /// Gets an item from the cache or creates it using the provided factory if it does not exist.
    /// Protects against cache stampedes using concurrent semaphores.
    /// </summary>
    Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null);

    /// <summary>
    /// Gets an item from the cache or creates it using the provided factory if it does not exist.
    /// Protects against cache stampedes using concurrent semaphores.
    /// </summary>
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, CacheEntryOptions options);

    /// <summary>
    /// Gets the current version number for a caching module to support version-based invalidation.
    /// </summary>
    Task<int> GetModuleVersionAsync(string module);

    /// <summary>
    /// Increments the version number for a caching module, effectively invalidating all current keys for that module.
    /// </summary>
    Task<int> IncrementModuleVersionAsync(string module);
}
