using ECommerce.API.Contracts.Auth;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _config;

    public AuthController(ApplicationDbContext context, IConfiguration config)
    {
        _context = context;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var identifier = request.Identifier?.Trim().ToLower();
        
        if (string.IsNullOrEmpty(identifier))
        {
            return Unauthorized(new { message = "Identifier is required" });
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == identifier || u.UserName.ToLower() == identifier || u.PhoneNumber == request.Identifier.Trim());

        if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email/username or password" });
        }

        var token = GenerateJwtToken(user);

        return new AuthResponse(token, new UserSummary(
            user.Id,
            user.FullName ?? user.UserName ?? "User",
            user.Email ?? "",
            user.Role,
            user.PhoneNumber
        ));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(SignupRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            return BadRequest(new { message = "Email already exists" });
        }

        var user = new ApplicationUser
        {
            FullName = request.FullName,
            Email = request.Email,
            UserName = request.Email,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer",
            EmailConfirmed = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        return new AuthResponse(token, new UserSummary(
            user.Id,
            user.FullName ?? "",
            user.Email ?? "",
            user.Role,
            user.PhoneNumber
        ));
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<UserSummary>> GetMe()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        return new UserSummary(
            user.Id,
            user.FullName ?? user.UserName ?? "User",
            user.Email ?? "",
            user.Role,
            user.PhoneNumber
        );
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out" });
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email ?? ""),
            new Claim(ClaimTypes.Name, user.FullName ?? user.UserName ?? ""),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var jwtKey = _config["Token:Key"] ?? "development_key_arzamart_123456789";
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
        
        // Ensure key is at least 32 bytes for HMACSHA256
        if (keyBytes.Length < 32)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            keyBytes = sha256.ComputeHash(keyBytes);
        }

        var key = new SymmetricSecurityKey(keyBytes);
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Token:Issuer"] ?? "ArzaMart",
            audience: _config["Token:Audience"] ?? "ArzaMartUsers",
            claims: claims,
            expires: DateTime.Now.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

