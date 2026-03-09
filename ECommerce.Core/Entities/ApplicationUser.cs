using Microsoft.AspNetCore.Identity;

namespace ECommerce.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string? FullName { get; set; }
    public bool IsSuspicious { get; set; } = false;
    public string Role { get; set; } = "Customer"; // Customer or Admin
}

