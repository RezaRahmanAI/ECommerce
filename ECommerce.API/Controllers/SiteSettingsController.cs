using System.Threading.Tasks;
using ECommerce.Core.Entities;
using ECommerce.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ECommerce.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [ResponseCache(Duration = 300, VaryByHeader = "Accept-Encoding")]
    public class SiteSettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SiteSettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [ResponseCache(Duration = 300)]
        public async Task<ActionResult<SiteSetting>> GetSettings()
        {
            var settings = await _context.SiteSettings.FirstOrDefaultAsync();
            
            if (settings == null)
            {
                return Ok(new SiteSetting());
            }

            return Ok(settings);
        }

        [HttpGet("delivery-methods")]
        [ResponseCache(Duration = 60)]
        public async Task<ActionResult<IEnumerable<DeliveryMethod>>> GetDeliveryMethods()
        {
            return await _context.DeliveryMethods
                .Where(m => m.IsActive)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
