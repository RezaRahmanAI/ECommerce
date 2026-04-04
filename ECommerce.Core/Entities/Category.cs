using System.Collections.Generic;

namespace ECommerce.Core.Entities;

public class Category : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public string? MetaTitle { get; set; }
    public string? MetaDescription { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public ICollection<Category> ChildCategories { get; set; } = new List<Category>();

    // Direct collections in category (migrating from SubCategory)
    public ICollection<Collection> Collections { get; set; } = new List<Collection>();

    // Direct products in category
    public ICollection<Product> Products { get; set; } = new List<Product>();
}
