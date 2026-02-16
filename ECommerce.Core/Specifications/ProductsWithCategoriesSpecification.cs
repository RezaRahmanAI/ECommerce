using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class ProductsWithCategoriesSpecification : BaseSpecification<Product>
{
    public ProductsWithCategoriesSpecification(string? sort, int? categoryId, int? subCategoryId, int? collectionId, string? categorySlug, string? subCategorySlug, string? collectionSlug, string? search, string? tier, string? tags)
        : base(x => 
            (string.IsNullOrEmpty(search) || x.Name.ToLower().Contains(search.ToLower()) || (x.Description != null && x.Description.ToLower().Contains(search.ToLower()))) &&
            (!categoryId.HasValue || x.CategoryId == categoryId) &&
            (!subCategoryId.HasValue || x.SubCategoryId == subCategoryId) &&
            (!collectionId.HasValue || x.CollectionId == collectionId) &&
            (string.IsNullOrEmpty(categorySlug) || x.Category.Slug == categorySlug) &&
            (string.IsNullOrEmpty(subCategorySlug) || (x.SubCategory != null && x.SubCategory.Slug == subCategorySlug)) &&
            (string.IsNullOrEmpty(collectionSlug) || (x.Collection != null && x.Collection.Slug == collectionSlug)) &&
            (string.IsNullOrEmpty(tier) || x.Tier == tier) &&
            (string.IsNullOrEmpty(tags) || (x.Tags != null && x.Tags.ToLower().Contains(tags.ToLower())))
        )

    {
        AddInclude(x => x.Category);
        AddInclude(x => x.SubCategory!);
        AddInclude(x => x.Collection!);
        AddInclude(x => x.Images);

        AddOrderBy(x => x.Name);

        if (!string.IsNullOrEmpty(sort))
        {
            switch (sort)
            {
                case "priceAsc":
                    AddOrderBy(p => p.Price);
                    break;
                case "priceDesc":
                    AddOrderByDescending(p => p.Price);
                    break;
                default:
                    AddOrderBy(n => n.Name);
                    break;
            }
        }
    }

    public ProductsWithCategoriesSpecification(int id) 
        : base(x => x.Id == id)
    {
        AddInclude(x => x.Category);
        AddInclude(x => x.Images);
    }
}
