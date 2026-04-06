using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class CategoriesWithSubCategoriesSpec : BaseSpecification<Category>
{
    public CategoriesWithSubCategoriesSpec()
    {
    }

    public CategoriesWithSubCategoriesSpec(int id) 
        : base(x => x.Id == id)
    {
    }

    public CategoriesWithSubCategoriesSpec(string name) 
        : base(x => x.Name == name)
    {
    }
}
