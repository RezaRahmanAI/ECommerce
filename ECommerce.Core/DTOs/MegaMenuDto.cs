using System.Collections.Generic;

namespace ECommerce.Core.DTOs;

public class MegaMenuDto
{
    public IEnumerable<MegaMenuCategoryDto> Categories { get; set; } = new List<MegaMenuCategoryDto>();
}

public class MegaMenuCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
}
