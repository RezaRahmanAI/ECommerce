using ECommerce.Core.DTOs;

using ECommerce.Core.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ECommerce.Core.Interfaces.ITokenService _tokenService;

    public AuthController(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager, ECommerce.Core.Interfaces.ITokenService tokenService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);

        if (user == null) return Unauthorized("Invalid email or password");

        var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

        if (!result.Succeeded) return Unauthorized("Invalid email or password");

        // Get actual roles from UserManager
        var roles = await _userManager.GetRolesAsync(user);
        var userRole = roles.FirstOrDefault() ?? "user";
        
        var token = _tokenService.CreateToken(user, userRole);

        return new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email!,
                Name = user.FullName ?? user.UserName!,
                Role = userRole
            }
        };
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
    {
        if (await _userManager.FindByEmailAsync(registerDto.Email) != null)
        {
            return BadRequest("Email is already in use");
        }

        var user = new ApplicationUser
        {
            FullName = registerDto.FullName,
            Email = registerDto.Email,
            UserName = registerDto.Email
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);

        if (!result.Succeeded) return BadRequest(result.Errors);

        // Assign default user role
        await _userManager.AddToRoleAsync(user, "User");

        var token = _tokenService.CreateToken(user, "User");

        return new AuthResponseDto
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                Name = user.FullName,
                Role = "User"
            }
        };
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Stateless JWT logout - handled on client side
        return Ok(new { message = "Logged out successfully" });
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        // Find by ID directly
        var userId = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirstValue("nameid");
        var user = userId != null ? await _userManager.FindByIdAsync(userId) : null;
        
        // Fallback to email
        if (user == null)
        {
            var email = User.FindFirstValue(System.Security.Claims.ClaimTypes.Email) ?? User.FindFirstValue("email");
            user = email != null ? await _userManager.FindByEmailAsync(email) : null;
        }
        
        if (user == null) return Unauthorized(new { message = "User not found in token claims." });

        var roles = await _userManager.GetRolesAsync(user);
        var userRole = roles.FirstOrDefault() ?? "user";

        return new UserDto
        {
            Id = user.Id,
            Email = user.Email!,
            Name = user.FullName ?? user.UserName!,
            Role = userRole
        };
    }
}
