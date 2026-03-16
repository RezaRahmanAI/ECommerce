using System.Linq.Expressions;
using ECommerce.Core.Interfaces;

namespace ECommerce.Core.Specifications;

public class BaseSpecification<T> : ISpecification<T>
{
    public BaseSpecification()
    {
    }

    public BaseSpecification(Expression<Func<T, bool>> criteria)
    {
        Criteria = criteria;
    }

    public Expression<Func<T, bool>> Criteria { get; }

    public List<Expression<Func<T, object>>> Includes { get; } = 
        new List<Expression<Func<T, object>>>();

    public Expression<Func<T, object>> OrderBy { get; private set; }

    public Expression<Func<T, object>> OrderByDescending { get; private set; }

    public int Take { get; private set; }

    public int Skip { get; private set; }

    public bool IsPagingEnabled { get; private set; }

    public bool IsSplitQuery { get; private set; }

    public bool IgnoreQueryFilters { get; private set; }

    public void AddInclude(Expression<Func<T, object>> includeExpression)
    {
        Includes.Add(includeExpression);
    }

    public void AddOrderBy(Expression<Func<T, object>> orderByExpression)
    {
        OrderBy = orderByExpression;
    }

    public void AddOrderByDescending(Expression<Func<T, object>> orderByDescExpression)
    {
        OrderByDescending = orderByDescExpression;
    }

    public void ApplyPaging(int skip, int take)
    {
        Skip = skip;
        Take = take;
        IsPagingEnabled = true;
    }

    public void ApplySplitQuery()
    {
        IsSplitQuery = true;
    }

    protected void ApplyIgnoreQueryFilters()
    {
        IgnoreQueryFilters = true;
    }
}
