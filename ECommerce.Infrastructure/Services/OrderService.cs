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

    public OrderService(IUnitOfWork unitOfWork, IMapper mapper, CustomerService customerService, ISteadfastService steadfastService)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _customerService = customerService;
        _steadfastService = steadfastService;
    }

    public async Task<OrderDto> CreateOrderAsync(OrderCreateDto orderDto)
    {
        var items = new List<OrderItem>();
        
        foreach (var itemDto in orderDto.Items)
        {
            var product = await _unitOfWork.Repository<Product>().GetByIdAsync(itemDto.ProductId);
            if (product == null) throw new KeyNotFoundException($"Product {itemDto.ProductId} not found");

            // Deduct from Main Product Stock
            if (product.StockQuantity < itemDto.Quantity) throw new InvalidOperationException($"Insufficient stock for {product.Name}");
            product.StockQuantity -= itemDto.Quantity;

            // Deduct from Variant Stock if size/color provided
            if (!string.IsNullOrEmpty(itemDto.Size))
            {
                var variantSpec = new BaseSpecification<ProductVariant>(v => v.ProductId == product.Id && v.Size == itemDto.Size);
                var variant = await _unitOfWork.Repository<ProductVariant>().GetEntityWithSpec(variantSpec);
                
                if (variant != null)
                {
                     if (variant.StockQuantity < itemDto.Quantity) throw new InvalidOperationException($"Insufficient stock for {product.Name} ({itemDto.Size})");
                     variant.StockQuantity -= itemDto.Quantity;
                     _unitOfWork.Repository<ProductVariant>().Update(variant);
                }
            }
            
            var orderItem = new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                UnitPrice = product.Price,
                Quantity = itemDto.Quantity,
                Color = itemDto.Color,
                Size = itemDto.Size,
                ImageUrl = product.ImageUrl
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
            DeliveryDetails = orderDto.DeliveryDetails,
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
            orderDto.Address,
            orderDto.DeliveryDetails
        );
        
        return _mapper.Map<Order, OrderDto>(order);
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

        return _mapper.Map<Order, OrderDto>(order);
    }

    public async Task<bool> UpdateOrderStatusAsync(int id, string status)
    {
        var spec = new BaseSpecification<Order>(x => x.Id == id);
        spec.AddInclude(x => x.Items);
        var order = await _unitOfWork.Repository<Order>().GetEntityWithSpec(spec);
        
        if (order == null) return false;

        if (Enum.TryParse<OrderStatus>(status, true, out var newStatus))
        {
            // Restore stock if cancelling
            if (newStatus == OrderStatus.Cancelled && order.Status != OrderStatus.Cancelled)
            {
                foreach (var item in order.Items)
                {
                    var product = await _unitOfWork.Repository<Product>().GetByIdAsync(item.ProductId);
                    if (product != null)
                    {
                        product.StockQuantity += item.Quantity;
                        _unitOfWork.Repository<Product>().Update(product);

                        if (!string.IsNullOrEmpty(item.Size))
                        {
                            var variantSpec = new BaseSpecification<ProductVariant>(v => v.ProductId == item.ProductId && v.Size == item.Size);
                            var variant = await _unitOfWork.Repository<ProductVariant>().GetEntityWithSpec(variantSpec);
                            if (variant != null)
                            {
                                variant.StockQuantity += item.Quantity;
                                _unitOfWork.Repository<ProductVariant>().Update(variant);
                            }
                        }
                    }
                }
            }

            // Courier Integration: Send to Steadfast when confirmed
            if (newStatus == OrderStatus.Confirmed && order.Status != OrderStatus.Confirmed)
            {
                if (order.SteadfastConsignmentId == null)
                {
                    var (consignmentId, trackingCode) = await _steadfastService.CreateOrderAsync(order);
                    if (consignmentId != null)
                    {
                        if (long.TryParse(consignmentId, out var cid))
                        {
                             order.SteadfastConsignmentId = cid;
                        }
                        order.SteadfastTrackingCode = trackingCode;
                        order.SteadfastStatus = "Sent";
                    }
                }
            }

            order.Status = newStatus;
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
}
