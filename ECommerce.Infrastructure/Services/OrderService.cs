using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using ECommerce.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.Infrastructure.Services;

public class OrderService : IOrderService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly CustomerService _customerService;
    private readonly ISteadfastService _steadfastService;
    private readonly INotificationService _notificationService;

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper, CustomerService customerService, ISteadfastService steadfastService, INotificationService notificationService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _customerService = customerService;
        _steadfastService = steadfastService;
        _notificationService = notificationService;
    }

    public async Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto)
    {
        var items = new List<OrderItem>();
        
        // 1. Bulk Fetch Products to fix N+1 query issue
        var productIds = orderDto.Items.Select(i => i.ProductId).Distinct().ToList();
        var productSpec = new ProductsWithCategoriesSpecification(productIds);
        
        // Pass track: true so EF Core tracks changes for stock deductions
        var products = await _unitOfWork.Repository<Product>().ListAsync(productSpec, track: true);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var itemDto in orderDto.Items)
        {
            if (!productDict.TryGetValue(itemDto.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");
            }

            // Calculate total units to deduct
            int totalDeduction = itemDto.Quantity;

            // Deduct from main product stock
            if (product.StockQuantity < totalDeduction)
                throw new InvalidOperationException($"Insufficient stock for {product.Headline}. Needed: {totalDeduction}, Available: {product.StockQuantity}");

            product.StockQuantity -= totalDeduction;
            _unitOfWork.Repository<Product>().Update(product);

            decimal unitPrice = product.Price;
            var itemImageUrl = product.Images?.FirstOrDefault(i => i.IsMain)?.Url ?? "";

            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Headline,
                UnitPrice = unitPrice,
                Quantity = itemDto.Quantity,
                Color = itemDto.Color,
                Size = itemDto.Size,
                ImageUrl = itemImageUrl
            };
            
            items.Add(orderItem);
        }

        var subtotal = items.Sum(i => i.TotalPrice);
        decimal shippingCost = 0;
        
        // Fetch Site Settings for Free Shipping Threshold
        var siteSettings = await _unitOfWork.Repository<SiteSetting>().ListAllAsync();
        var settings = siteSettings.FirstOrDefault();
        var freeShippingThreshold = settings?.FreeShippingThreshold ?? 0;

        // Lookup delivery method if provided
        if (orderDto.DeliveryMethodId.HasValue)
        {
            var method = await _unitOfWork.Repository<DeliveryMethod>().GetByIdAsync(orderDto.DeliveryMethodId.Value);
            if (method != null)
            {
                if (freeShippingThreshold > 0 && subtotal >= freeShippingThreshold)
                {
                    shippingCost = 0;
                }
                else
                {
                    shippingCost = method.Cost;
                }
            }
        }
        else
        {
             // If no delivery method is selected, we should strictly require it or default to 0/handling
             // ideally the frontend forces a selection.
             shippingCost = 0; 
        }

        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}",
            CustomerName = orderDto.Name,
            CustomerPhone = orderDto.Phone,
            ShippingAddress = orderDto.Address,
            City = orderDto.City,
            Area = orderDto.Area,
            Items = items,
            SubTotal = subtotal,
            Tax = 0,
            ShippingCost = shippingCost,
            DeliveryMethodId = orderDto.DeliveryMethodId,
            Status = OrderStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };
        
        order.Total = order.SubTotal + order.Tax + order.ShippingCost;

        _unitOfWork.Repository<Order>().Add(order);
        
        await _unitOfWork.Complete();

        await _customerService.CreateOrUpdateCustomerAsync(
            orderDto.Phone,
            orderDto.Name,
            orderDto.Address
        );
        Console.WriteLine("--- ABOUT TO MAP ORDER TO ORDERDTO ---");
        try {
            var result = _mapper.Map<Order, OrderDto>(order);
            Console.WriteLine("--- MAPPING SUCCESSFUL ---");

            // Notify admins about new order
            try 
            {
                await _notificationService.NotifyNewOrderAsync(result.Id, result.OrderNumber, result.CustomerName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Notification] Error sending new order notification: {ex.Message}");
            }

            return result;
        } catch (Exception ex) {
            Console.WriteLine($"--- MAPPING FAILED: {ex.Message} ---");
            throw;
        }
    }

    public async Task<IReadOnlyList<OrderDto>> GetOrdersAsync()
    {
        var spec = new BaseSpecification<Order>();
        spec.AddInclude(x => x.Items);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
            
        return _mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders);
    }

    public async Task<OrderDto?> GetOrderByIdAsync(int id)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        return _mapper.Map<Order, OrderDto>(order!);
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string status)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        
        if (order == null) return false;

        if (Enum.TryParse<OrderStatus>(status, true, out var newStatus))
        {
            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
            {
                var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
                var products = await _unitOfWork.Repository<Product>().ListAsync(
                    new ProductsWithCategoriesSpecification(productIds), track: true);
                var productDict = products.ToDictionary(p => p.Id);

                foreach (var item in order.Items)
                {
                    if (productDict.TryGetValue(item.ProductId, out var product))
                    {
                        product.StockQuantity += item.Quantity;
                    }
                }
            }

            order.Status = newStatus;
            
            if (newStatus == OrderStatus.Confirmed && order.SteadfastConsignmentId == null)
            {
                try
                {
                    var (consignmentId, trackingCode) = await _steadfastService.CreateOrderAsync(order);
                    if (!string.IsNullOrEmpty(consignmentId))
                    {
                        if (long.TryParse(consignmentId, out var cid))
                        {
                            order.SteadfastConsignmentId = cid;
                        }
                        order.SteadfastTrackingCode = trackingCode;
                        order.SteadfastStatus = "in_review";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error sending order {order.Id} to Steadfast: {ex.Message}");
                }
            }
            
            _unitOfWork.Repository<Order>().Update(order);
            return await _unitOfWork.Complete() > 0;
        }

        return false;
    }

    public async Task<(IReadOnlyList<OrderDto> Items, int Total)> GetOrdersForAdminAsync(string? searchTerm, string? status, string? dateRange, int page, int pageSize)
    {
        var spec = new OrdersWithFiltersForAdminSpecification(searchTerm, status, dateRange);
        var total = await _unitOfWork.Repository<Order>().CountAsync(spec);
        
        spec.ApplyPaging(pageSize * (page - 1), pageSize);
        var orders = await _unitOfWork.Repository<Order>().ListAsync(spec);
        
        return (_mapper.Map<IReadOnlyList<Order>, IReadOnlyList<OrderDto>>(orders), total);
    }

    public async Task<bool> UpdateOrderAsync(int id, OrderUpdateDto orderUpdateDto)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return false;

        // Update basic fields if provided
        if (orderUpdateDto.CustomerName != null) order.CustomerName = orderUpdateDto.CustomerName;
        if (orderUpdateDto.CustomerPhone != null) order.CustomerPhone = orderUpdateDto.CustomerPhone;
        if (orderUpdateDto.ShippingAddress != null) order.ShippingAddress = orderUpdateDto.ShippingAddress;
        if (orderUpdateDto.City != null) order.City = orderUpdateDto.City;
        if (orderUpdateDto.Area != null) order.Area = orderUpdateDto.Area;

        // Update Items if provided
        if (orderUpdateDto.Items != null)
        {
            // Simple approach: Replace items and handle stock logic if order isn't cancelled
            // 1. Return old stock if order wasn't cancelled
            if (order.Status != OrderStatus.Cancelled)
            {
                foreach (var item in order.Items)
                {
                    var product = await _unitOfWork.Repository<Product>().GetByIdAsync(item.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        _unitOfWork.Repository<Product>().Update(product);
                    }
                }
            }

            // 2. Clear old items
            order.Items = new List<OrderItem>();

            // 3. Add new items and deduct stock
            foreach (var itemDto in orderUpdateDto.Items)
            {
                var product = await _unitOfWork.Repository<Product>().GetByIdAsync(itemDto.ProductId);
                if (product == null) throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");

                if (order.Status != OrderStatus.Cancelled)
                {
                    product.StockQuantity -= itemDto.Quantity;
                    _unitOfWork.Repository<Product>().Update(product);
                }

                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Headline,
                    UnitPrice = itemDto.UnitPrice ?? product.Price,
                    Quantity = itemDto.Quantity,
                    Color = itemDto.Color,
                    Size = itemDto.Size,
                    ImageUrl = product.Images?.FirstOrDefault(i => i.IsMain)?.Url ?? ""
                });
            }

            // 4. Recalculate totals
            order.SubTotal = order.Items.Sum(i => i.TotalPrice);
            order.Total = order.SubTotal + order.Tax + order.ShippingCost;
        }

        // Update Status if provided
        if (orderUpdateDto.Status != null)
        {
            if (Enum.TryParse<OrderStatus>(orderUpdateDto.Status, true, out var newStatus))
            {
                order.Status = newStatus;
            }
        }

        _unitOfWork.Repository<Order>().Update(order);
        return await _unitOfWork.Complete() > 0;
    }
}
