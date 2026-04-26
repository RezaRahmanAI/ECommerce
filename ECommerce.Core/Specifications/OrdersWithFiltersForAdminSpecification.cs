using System;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange, DateTime? fromDate, DateTime? toDate) 
        : base(GenerateCriteria(searchTerm, status, dateRange, fromDate, toDate))
    {
        AddInclude(o => o.Items);
        AddOrderByDescending(o => o.CreatedAt);
    }

    private static Expression<Func<Order, bool>> GenerateCriteria(string? searchTerm, string? status, string? dateRange, DateTime? fromDate, DateTime? toDate)
    {
        OrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status) && status != "All" && Enum.TryParse<OrderStatus>(status, true, out var parsed))
        {
            statusEnum = parsed;
        }

        return o => 
            (string.IsNullOrEmpty(searchTerm) || o.OrderNumber.Contains(searchTerm) || o.CustomerName.Contains(searchTerm) || o.CustomerPhone.Contains(searchTerm)) &&
            (!statusEnum.HasValue || o.Status == statusEnum.Value) &&
            (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" || 
             (dateRange == "Today" && o.CreatedAt >= DateTime.UtcNow.Date) ||
             (dateRange == "Yesterday" && o.CreatedAt >= DateTime.UtcNow.Date.AddDays(-1) && o.CreatedAt < DateTime.UtcNow.Date) ||
             (dateRange == "Last 7 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-7)) ||
             (dateRange == "Last 30 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-30)) ||
             (dateRange == "This Year" && o.CreatedAt.Year == DateTime.UtcNow.Year) ||
             (dateRange == "Custom" && (!fromDate.HasValue || o.CreatedAt.Date >= fromDate.Value.Date) && (!toDate.HasValue || o.CreatedAt.Date <= toDate.Value.Date))
            );
    }
}
