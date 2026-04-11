using Microsoft.AspNetCore.SignalR;

namespace ECommerce.API.Hubs;

public class NotificationHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        // For now, we just broadcast to everyone, so no grouping or authentication check is strictly needed.
        // But we can add users to groups here if needed.
        await base.OnConnectedAsync();
    }
}
