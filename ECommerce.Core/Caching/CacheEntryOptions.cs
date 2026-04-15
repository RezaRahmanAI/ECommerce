using System;

namespace ECommerce.Core.Caching;

/// <summary>
/// Configuration options for an individual cache entry.
/// </summary>
public class CacheEntryOptions
{
    /// <summary>
    /// Gets or sets the absolute expiration relative to now. Required to set a hard TTL ceiling.
    /// </summary>
    public TimeSpan AbsoluteExpirationRelativeToNow { get; set; }

    /// <summary>
    /// Gets or sets how long a cache entry can be inactive before it will be removed. 
    /// Must be paired with AbsoluteExpirationRelativeToNow.
    /// </summary>
    public TimeSpan? SlidingExpiration { get; set; }

    /// <summary>
    /// Gets or sets the size of the cache entry for memory pressure control.
    /// Minimum is 1.
    /// </summary>
    public int Size { get; set; } = 1;
}
