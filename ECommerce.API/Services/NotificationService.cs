using ECommerce.API.Hubs;
using ECommerce.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace ECommerce.API.Services;

public class NotificationService : INotificationService
{
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(IHubContext<NotificationHub> hubContext)
    {
        _hubContext = hubContext;
    }

    public async Task NotifyNewOrderAsync(int orderId, string orderNumber, string customerName)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveNewOrder", new { orderId, orderNumber, customerName });
    }

    public async Task NotifyOrderStatusUpdateAsync(int orderId, string newStatus)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", new { orderId, newStatus });
    }

    public async Task NotifyProductUpdateAsync(string action, int productId)
    {
        await _hubContext.Clients.All.SendAsync("ReceiveProductUpdate", new { action, productId });
    }

    public async Task NotifySettingsUpdateAsync()
    {
        await _hubContext.Clients.All.SendAsync("ReceiveSettingsUpdate");
    }
}
