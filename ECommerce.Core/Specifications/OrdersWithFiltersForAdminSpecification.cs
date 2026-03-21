using System;
using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class OrdersWithFiltersForAdminSpecification : BaseSpecification<Order>
{
    public OrdersWithFiltersForAdminSpecification(string? searchTerm, string? status, string? dateRange, DateTime? startDate = null, DateTime? endDate = null, string? sort = null, string? sortDir = "desc") 
        : base(GetCriteria(searchTerm, status, dateRange, startDate, endDate))
    {
        AddInclude(o => o.Items);
        
        // Sorting logic
        var descending = sortDir?.ToLower() == "asc" ? false : true; // Default to desc if not asc
        
        if (!string.IsNullOrEmpty(sort))
        {
            switch (sort.ToLower())
            {
                case "date":
                case "createdat":
                    if (descending) AddOrderByDescending(o => o.CreatedAt);
                    else AddOrderBy(o => o.CreatedAt);
                    break;
                case "status":
                    if (descending) AddOrderByDescending(o => o.Status);
                    else AddOrderBy(o => o.Status);
                    break;
                case "total":
                    if (descending) AddOrderByDescending(o => o.Total);
                    else AddOrderBy(o => o.Total);
                    break;
                case "id":
                case "ordernumber":
                    if (descending) AddOrderByDescending(o => o.OrderNumber);
                    else AddOrderBy(o => o.OrderNumber);
                    break;
                case "name":
                case "customername":
                    if (descending) AddOrderByDescending(o => o.CustomerName);
                    else AddOrderBy(o => o.CustomerName);
                    break;
                default:
                    AddOrderByDescending(o => o.CreatedAt);
                    break;
            }
        }
        else
        {
            AddOrderByDescending(o => o.CreatedAt);
        }
    }

    private static Expression<Func<Order, bool>> GetCriteria(string? searchTerm, string? status, string? dateRange, DateTime? startDate, DateTime? endDate)
    {
        // 1. Process Status
        OrderStatus? statusEnum = null;
        if (!string.IsNullOrEmpty(status))
        {
            var cleanStatus = status.Trim();
            if (!cleanStatus.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (Enum.TryParse<OrderStatus>(cleanStatus, true, out var result))
                {
                    statusEnum = result;
                }
            }
        }

        // 2. Build Expression
        return o => 
            (string.IsNullOrEmpty(searchTerm) || 
             o.OrderNumber.Contains(searchTerm) || 
             o.CustomerName.Contains(searchTerm) || 
             o.CustomerPhone.Contains(searchTerm)) &&
            
            (!statusEnum.HasValue || o.Status == statusEnum.Value) &&
            
            (
                (startDate != null || endDate != null) 
                ? ((startDate == null || o.CreatedAt >= startDate) && 
                   (endDate == null || o.CreatedAt <= endDate.Value.Date.AddDays(1).AddTicks(-1)))
                : (string.IsNullOrEmpty(dateRange) || dateRange == "All Time" ||
                  (dateRange == "Today" && o.CreatedAt >= DateTime.UtcNow.Date) ||
                  (dateRange == "Yesterday" && o.CreatedAt >= DateTime.UtcNow.Date.AddDays(-1) && o.CreatedAt < DateTime.UtcNow.Date) ||
                  (dateRange == "Last 7 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-7)) ||
                  (dateRange == "Last 30 Days" && o.CreatedAt >= DateTime.UtcNow.AddDays(-30)))
            );
    }
}
