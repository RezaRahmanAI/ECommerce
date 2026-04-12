using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Caching.Memory;

namespace ECommerce.Infrastructure.Services;

public class CacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private static readonly ConcurrentDictionary<string, byte> _cacheKeys = new();

    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public CacheService(IMemoryCache memoryCache)
    {
        _memoryCache = memoryCache;
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        if (_memoryCache.TryGetValue(key, out T? result))
        {
            return result;
        }
        return default;
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (value == null) return;

        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromHours(1),
            Size = 1 // Required because SizeLimit is set in ServiceExtensions
        };

        _memoryCache.Set(key, value, options);
        _cacheKeys.TryAdd(key, 0);
    }

    public async Task RemoveAsync(string key)
    {
        _memoryCache.Remove(key);
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