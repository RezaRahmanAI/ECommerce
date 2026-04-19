using System.Linq.Expressions;
using ECommerce.Core.Entities;

namespace ECommerce.Core.Specifications;

public class ReviewSpecification : BaseSpecification<Review>
{
    public ReviewSpecification(int productId) 
        : base(r => r.ProductId == productId && r.IsApproved)
    {
        AddInclude(r => r.Product!);
        AddOrderByDescending(r => r.Date);
    }

    public ReviewSpecification() 
        : base(r => r.IsApproved)
    {
        AddInclude(r => r.Product!);
        AddOrderByDescending(r => r.Date);
        ApplyPaging(0, 12); // Show top 12 reviews
    }
}
