using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ECommerce.Infrastructure.Services;

public class TokenService : ITokenService
{
    private readonly IConfiguration _config;
    private readonly SymmetricSecurityKey _key;

    public TokenService(IConfiguration config)
    {
        _config = config;
        // In production, use a secure key from KeyVault or Environment Variables
        // For development, we'll check if a key exists, otherwise use a default one
        var tokenKey = _config["Token:Key"] ?? "super_secret_key_that_is_long_enough_for_sha256";
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
    }

    public string CreateToken(ApplicationUser user, List<string> roles)
    {
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new Claim(JwtRegisteredClaimNames.GivenName, user.FullName ?? user.UserName ?? ""),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        // Add role claims for each role
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var creds = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.Now.AddDays(7),
            SigningCredentials = creds,
            Issuer = _config["Token:Issuer"], // Optional
            Audience = _config["Token:Audience"] // Optional
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}
