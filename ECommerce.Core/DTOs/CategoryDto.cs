namespace ECommerce.Core.DTOs;

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public int DisplayOrder { get; set; }
    public int ProductCount { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int? ParentId { get; set; }
    public IEnumerable<CategoryDto> ChildCategories { get; set; } = new List<CategoryDto>();
}

public class CategoryCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentId { get; set; }
}

public class CategoryUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string? ImageUrl { get; set; }
    public bool? IsActive { get; set; }
    public int? DisplayOrder { get; set; }
    public int? ParentId { get; set; }
}

public class ReorderCategoriesDto
{

    public List<int> OrderedIds { get; set; } = new();
}






