using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync()
    {
        var totalOrders = await _context.Orders.CountAsync();
        var totalProducts = await _context.Products.CountAsync();
        var totalCustomers = await _context.Users.CountAsync();
        
        var deliveredOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Delivered);
        var pendingOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Pending || o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.Processing);
        var shippedOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Shipped);
        var cancelledOrders = await _context.Orders.CountAsync(o => o.Status == OrderStatus.Cancelled);

        // Revenue from Delivered and Shipped orders
        var totalRevenue = await _context.Orders
            .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped)
            .SumAsync(o => (decimal?)o.Total) ?? 0;

        // Calculate Average Selling Price (ASP)
        var totalItemsSold = await _context.Orders
            .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped)
            .SelectMany(o => o.Items)
            .SumAsync(i => (int?)i.Quantity) ?? 0;
            
        var avgSellingPrice = totalItemsSold > 0 ? totalRevenue / totalItemsSold : 0;

        // Calculate Total Purchase Cost (Sum of PurchaseRate * Quantity for sold items)
        var totalPurchaseCost = await _context.Orders
            .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped)
            .SelectMany(o => o.Items)
            .SumAsync(i => (decimal?)(i.Product.PurchaseRate * i.Quantity)) ?? 0;

        return new DashboardStatsDto
        {
            TotalOrders = totalOrders,
            TotalProducts = totalProducts,
            TotalCustomers = totalCustomers,
            TotalRevenue = totalRevenue,
            DeliveredOrders = deliveredOrders,
            PendingOrders = pendingOrders,
            ReturnedOrders = 0, // Placeholder as there's no Return status yet
            CustomerQueries = 0, // Placeholder
            TotalPurchaseCost = totalPurchaseCost,
            AverageSellingPrice = avgSellingPrice,
            ReturnValue = 0,
            ReturnRate = "0%"
        };
    }


    public async Task<List<PopularProductDto>> GetPopularProductsAsync()
    {
        // Get products with actual sold count from completed orders
        var products = await _context.Products
            .Include(p => p.Images)
            .Select(p => new
            {
                Product = p,
                SoldCount = _context.Orders
                    .Where(o => o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped)
                    .SelectMany(o => o.Items)
                    .Where(i => i.ProductId == p.Id)
                    .Sum(i => (int?)i.Quantity) ?? 0
            })
            .OrderByDescending(x => x.SoldCount)
            .Take(5)
            .ToListAsync();

        return products.Select(x => new PopularProductDto
        {
            Id = x.Product.Id,
            Name = x.Product.Name,
            Price = x.Product.Price,
            Stock = x.Product.StockQuantity,
            SoldCount = x.SoldCount,
            ImageUrl = x.Product.ImageUrl ?? x.Product.Images.FirstOrDefault()?.Url ?? ""
        }).ToList();
    }

    public async Task<List<RecentOrderDto>> GetRecentOrdersAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new RecentOrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = o.CustomerName,
                OrderDate = o.CreatedAt,
                Total = o.Total,
                Status = o.Status.ToString(),
                PaymentStatus = "Paid" // Placeholder
            })
            .ToListAsync();
    }
    public async Task<List<SalesDataDto>> GetSalesDataAsync(string period)
    {
        var endDate = DateTime.UtcNow;
        var startDate = period.ToLower() switch
        {
            "week" => endDate.AddDays(-7),
            "month" => endDate.AddMonths(-1),
            "year" => endDate.AddYears(-1),
            _ => endDate.AddMonths(-1) // Default to last 30 days
        };

        var salesData = await _context.Orders
            .Where(o => (o.Status == OrderStatus.Delivered || o.Status == OrderStatus.Shipped) &&
                        o.CreatedAt >= startDate && o.CreatedAt <= endDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new 
            {
                Date = g.Key,
                Amount = g.Sum(o => o.Total)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return salesData.Select(x => new SalesDataDto
        {
            Date = x.Date.ToString("yyyy-MM-dd"),
            Amount = x.Amount
        }).ToList();
    }

    public async Task<List<StatusDistributionDto>> GetOrderStatusDistributionAsync()
    {
        var distribution = await _context.Orders
            .GroupBy(o => o.Status)
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        return distribution.Select(x => new StatusDistributionDto
        {
            Status = x.Status.ToString(),
            Count = x.Count
        }).ToList();
    }

    public async Task<List<CustomerGrowthDto>> GetCustomerGrowthAsync()
    {
        // Get last 6 months of customer growth
        var startDate = DateTime.UtcNow.AddMonths(-6);

        var growth = await _context.Customers 
            .Where(c => c.CreatedAt >= startDate)
            .GroupBy(c => new { c.CreatedAt.Year, c.CreatedAt.Month })
            .Select(g => new 
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Count = g.Count()
            })
            .OrderBy(x => x.Year).ThenBy(x => x.Month)
            .ToListAsync();

        return growth.Select(x => new CustomerGrowthDto
        {
            Date = $"{x.Year}-{x.Month:00}",
            Count = x.Count
        }).ToList();
    }
}
