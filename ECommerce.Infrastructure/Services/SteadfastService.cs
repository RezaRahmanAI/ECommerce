using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Infrastructure.Services;

public class SteadfastSettings
{
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
}

public class SteadfastService : ISteadfastService
{
    private readonly HttpClient _httpClient;
    private readonly SteadfastSettings _settings;
    private readonly ILogger<SteadfastService> _logger;

    public SteadfastService(HttpClient httpClient, IOptions<SteadfastSettings> settings, ILogger<SteadfastService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
        
        if (!_settings.BaseUrl.EndsWith("/")) _settings.BaseUrl += "/";
        _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
        _httpClient.DefaultRequestHeaders.Add("Api-Key", _settings.ApiKey);
        _httpClient.DefaultRequestHeaders.Add("Secret-Key", _settings.SecretKey);
    }

    public async Task<(string? ConsignmentId, string? TrackingCode)> CreateOrderAsync(Order order)
    {
        try
        {
            var fullAddress = string.Join(", ", new[] { order.ShippingAddress, order.Area, order.City }.Where(s => !string.IsNullOrEmpty(s)));
            var itemsList = order.Items != null && order.Items.Any() 
                ? string.Join(", ", order.Items.Select(i => $"{i.ProductName} ({i.Quantity})"))
                : $"Order {order.OrderNumber}";

            var payload = new
            {
                invoice = order.OrderNumber,
                recipient_name = order.CustomerName,
                recipient_phone = order.CustomerPhone,
                recipient_address = fullAddress,
                cod_amount = order.Total,
                note = "Delivery from SheraShopBD",
                item_description = itemsList
            };
            
            var response = await _httpClient.PostAsJsonAsync("create_order", payload);
            var content = await response.Content.ReadAsStringAsync();
            
            _logger.LogInformation($"Steadfast API Response for Order {order.Id}: {content}");
            
            if (response.IsSuccessStatusCode)
            {
                using var doc = JsonDocument.Parse(content);
                var root = doc.RootElement;
                if (root.TryGetProperty("consignment", out var consignment))
                {
                    string? cid = null;
                    string? tracking = null;

                    if (consignment.TryGetProperty("consignment_id", out var cidElem))
                    {
                        // Handle both numeric and string values, stripping quotes if necessary
                        cid = cidElem.GetRawText().Trim('"');
                    }
                    
                    if (consignment.TryGetProperty("tracking_code", out var trackElem))
                    {
                        tracking = trackElem.GetString();
                    }

                    if (!string.IsNullOrEmpty(cid))
                    {
                        return (cid, tracking);
                    }
                }
            }
            else
            {
                _logger.LogError($"Steadfast API Error for Order {order.Id}: {content}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Exception sending order {order.Id} to Steadfast");
        }
        
        return (null, null);
    }
}
