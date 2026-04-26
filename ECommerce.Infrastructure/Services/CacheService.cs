using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using ECommerce.Core.Caching;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace ECommerce.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    private readonly ILogger<CacheService> _logger;
    private static readonly ConcurrentDictionary<string, byte> _cacheKeys = new();
    
    // Stampede protection
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public CacheService(IMemoryCache memoryCache, IDistributedCache distributedCache, ILogger<CacheService> logger)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        // Layer 1: Memory
        if (_memoryCache.TryGetValue(key, out T? memoryResult))
        {
            _logger.LogDebug("Layer 1 (Memory) Cache hit for key: {Key}", key);
            return memoryResult;
        }

        // Layer 2: Distributed
        var distributedResult = await _distributedCache.GetStringAsync(key);
        if (distributedResult == null)
        {
            return default;
        }

        try
        {
            var deserialized = JsonSerializer.Deserialize<T>(distributedResult, _jsonOptions);
            
            // Backfill memory cache
            if (deserialized != null)
            {
                _logger.LogDebug("Layer 2 (Distributed) hit. Backfilling Memory for key: {Key}", key);
                _memoryCache.Set(key, deserialized, new MemoryCacheEntryOptions { 
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10), // Short backfill TTL
                    Size = 1
                });
            }

            return deserialized;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deserializing cache key: {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (value == null) return;

        var expirationTime = expiration ?? TimeSpan.FromHours(1);

        // Layer 1: Memory
        var memoryOptions = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expirationTime,
            Size = 1
        };
        memoryOptions.RegisterPostEvictionCallback(OnPostEviction);
        _memoryCache.Set(key, value, memoryOptions);

        // Layer 2: Distributed
        var distributedOptions = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expirationTime
        };
        var serialized = JsonSerializer.Serialize(value, _jsonOptions);
        await _distributedCache.SetStringAsync(key, serialized, distributedOptions);

        _cacheKeys.TryAdd(key, 0);
    }

    public async Task RemoveAsync(string key)
    {
        _memoryCache.Remove(key);
        await _distributedCache.RemoveAsync(key);
        _cacheKeys.TryRemove(key, out _);
        _logger.LogDebug("Invalidated cache key from all layers: {Key}", key);
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        var keysToRemove = _cacheKeys.Keys.Where(k => k.StartsWith(prefix)).ToList();
        foreach (var key in keysToRemove)
        {
            await RemoveAsync(key);
        }
        _logger.LogDebug("Invalidated {Count} keys with prefix: {Prefix}", keysToRemove.Count, prefix);
    }

    public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null)
    {
        return await GetOrCreateAsync(key, factory, new CacheEntryOptions 
        { 
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromHours(1),
            Size = 1 
        });
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, CacheEntryOptions options)
    {
        var cachedValue = await GetAsync<T>(key);
        if (cachedValue != null)
        {
            _logger.LogDebug("Cache hit for key: {Key}", key);
            return cachedValue;
        }

        _logger.LogInformation("Cache miss for key: {Key}", key);

        var keyLock = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        
        var waitStartTime = DateTime.UtcNow;
        await keyLock.WaitAsync();
        try
        {
            var waitDuration = DateTime.UtcNow - waitStartTime;
            if (waitDuration.TotalSeconds > 1)
            {
                _logger.LogWarning("Stampede guard timeout exceeded 1 second for key {Key}. Waited: {Duration}ms", key, waitDuration.TotalMilliseconds);
            }

            // Check again in case another thread populated it while we waited
            cachedValue = await GetAsync<T>(key);
            if (cachedValue != null)
            {
                _logger.LogDebug("Cache hit (after lock) for key: {Key}", key);
                return cachedValue;
            }

            var value = await factory();

            if (value != null)
            {
                var cacheEntryOptions = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = options.AbsoluteExpirationRelativeToNow,
                    Size = options.Size
                };

                if (options.SlidingExpiration.HasValue)
                {
                    cacheEntryOptions.SlidingExpiration = options.SlidingExpiration;
                }

                cacheEntryOptions.RegisterPostEvictionCallback(OnPostEviction);

                _memoryCache.Set(key, value, cacheEntryOptions);
                _cacheKeys.TryAdd(key, 0);
            }

            return value;
        }
        finally
        {
            keyLock.Release();
            // Clean up semaphore if no one else is waiting
            if (keyLock.CurrentCount == 1)
            {
                _locks.TryRemove(key, out _);
            }
        }
    }

    public Task<int> GetModuleVersionAsync(string module)
    {
        var versionKey = $"cache_version_{module}";
        if (_memoryCache.TryGetValue(versionKey, out int currentVersion))
        {
            return Task.FromResult(currentVersion);
        }
        
        return Task.FromResult(1);
    }

    public Task<int> IncrementModuleVersionAsync(string module)
    {
        var versionKey = $"cache_version_{module}";
        
        var newVersion = _memoryCache.TryGetValue(versionKey, out int currentVersion) ? currentVersion + 1 : 2;
        
        var options = new MemoryCacheEntryOptions
        {
            Priority = CacheItemPriority.NeverRemove,
            Size = 1
        };
        
        _memoryCache.Set(versionKey, newVersion, options);
        _logger.LogDebug("Incremented cache version for module {Module} to {Version}", module, newVersion);
        
        return Task.FromResult(newVersion);
    }

    private void OnPostEviction(object key, object? value, EvictionReason reason, object? state)
    {
        var keyStr = key.ToString();
        if (!string.IsNullOrEmpty(keyStr))
        {
            _cacheKeys.TryRemove(keyStr, out _);
            _logger.LogDebug("Evicted cache key: {Key}. Reason: {Reason}", keyStr, reason);
        }
    }
}