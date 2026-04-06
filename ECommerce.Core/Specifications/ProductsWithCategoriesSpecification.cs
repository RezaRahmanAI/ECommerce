using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class ProductsWithCategoriesSpecification : BaseSpecification<Product>
{
    public ProductsWithCategoriesSpecification(string? sort, int? categoryId, string? categorySlug, string? search, bool? isNew = null, int? skip = null, int? take = null)
        : base(x => 
            (string.IsNullOrEmpty(search) || x.Headline.ToLower().Contains(search.ToLower()) || (x.Subtitle != null && x.Subtitle.ToLower().Contains(search.ToLower()))) &&
            (!categoryId.HasValue || x.CategoryId == categoryId) &&
            (string.IsNullOrEmpty(categorySlug) || (x.Category != null && x.Category.Slug == categorySlug)) &&
            (!isNew.HasValue || x.IsNew == isNew.Value)
        )
    {
        AddInclude(x => x.Category!);
        AddInclude(x => x.Images);

        AddOrderBy(x => x.Headline);

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
                case "id_desc":
                    AddOrderByDescending(p => p.Id);
                    break;
                default:
                    AddOrderBy(n => n.Headline);
                    break;
            }
        }

        if (skip.HasValue && take.HasValue)
        {
            ApplyPaging(skip.Value, take.Value);
        }
    }

    public ProductsWithCategoriesSpecification(int id) 
        : base(x => x.Id == id)
    {
        AddIncludes();
    }

    public ProductsWithCategoriesSpecification(IEnumerable<int> ids)
        : base(x => ids.Contains(x.Id))
    {
        AddIncludes();
    }

    public ProductsWithCategoriesSpecification(string slug) 
        : base(x => x.Slug == slug)
    {
        AddIncludes();
    }

    public ProductsWithCategoriesSpecification()
        : base(x => x.IsActive)
    {
        AddIncludes();
    }

    private void AddIncludes()
    {
        AddInclude(x => x.Category!);
        AddInclude(x => x.Images);
    }
}
