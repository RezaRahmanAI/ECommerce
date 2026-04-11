using System.Threading.Tasks;

namespace ECommerce.Core.Interfaces;

public interface INotificationService
{
    Task NotifyNewOrderAsync(int orderId, string orderNumber, string customerName);
    Task NotifyOrderStatusUpdateAsync(int orderId, string newStatus);
    Task NotifyProductUpdateAsync(string action, int productId);
    Task NotifySettingsUpdateAsync();
}
