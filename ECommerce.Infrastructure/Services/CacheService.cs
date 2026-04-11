using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly IDistributedCache _distributedCache;
    
    // To support Multi-Layer Wildcard Invalidation: 
    // We keep track of keys in memory to allow Prefix Removal if using IDistributedCache without Redis-specific commands.
    // In a real Redis environment, we'd use StackExchange.Redis keys scan, but here we stay provider-agnostic.
    private static readonly ConcurrentDictionary<string, byte> _cacheKeys = new();

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public CacheService(IMemoryCache memoryCache, IDistributedCache distributedCache)
    {
        _memoryCache = memoryCache;
        _distributedCache = distributedCache;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        // Layer 1: Memory
        if (_memoryCache.TryGetValue(key, out T? memoryResult))
        {
            return memoryResult;
        }

        // Layer 2: Distributed
        try 
        {
            var distributedResult = await _distributedCache.GetStringAsync(key);
            if (distributedResult == null) return default;

            var deserialized = JsonSerializer.Deserialize<T>(distributedResult, _jsonOptions);
            
            // Backfill memory cache
            if (deserialized != null)
            {
                _memoryCache.Set(key, deserialized, TimeSpan.FromMinutes(1)); // Short backfill TTL
            }

            return deserialized;
        }
        catch (Exception ex)
        {
            // Log once per failure? Or just swallow and let Layer 1/Factory handle it.
            // We'll let it fall through to the factory.
            Console.WriteLine($"[CacheService] Redis GET failed for key '{key}': {ex.Message}. Falling back to source.");
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (value == null) return;

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromHours(1)
        };

        var serialized = JsonSerializer.Serialize(value, _jsonOptions);
        
        try
        {
            await _distributedCache.SetStringAsync(key, serialized, options);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CacheService] Redis SET failed for key '{key}': {ex.Message}. Using MemoryCache only.");
        }

        _memoryCache.Set(key, value, expiration ?? TimeSpan.FromHours(1));
        _cacheKeys.TryAdd(key, 0);
    }

    public async Task RemoveAsync(string key)
    {
        _memoryCache.Remove(key);
        try
        {
            await _distributedCache.RemoveAsync(key);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[CacheService] Redis REMOVE failed for key '{key}': {ex.Message}");
        }
        _cacheKeys.TryRemove(key, out _);
    }

    public async Task RemoveByPrefixAsync(string prefix)
    {
        var keysToRemove = _cacheKeys.Keys.Where(k => k.StartsWith(prefix)).ToList();
        foreach (var key in keysToRemove)
        {
            await RemoveAsync(key);
        }
    }

    public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T?>> factory, TimeSpan? expiration = null)
    {
        var cached = await GetAsync<T>(key);
        if (cached != null) return cached;

        var freshValue = await factory();
        if (freshValue != null)
        {
            await SetAsync(key, freshValue, expiration);
        }

        return freshValue;
    }
}
