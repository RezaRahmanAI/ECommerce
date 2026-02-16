using AutoMapper;
using ECommerce.Core.DTOs;
using ECommerce.Core.Entities;
using ECommerce.Core.Interfaces;
using ECommerce.Core.Specifications;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<Category> _categoryRepo;
    private readonly IMapper _mapper;

    public CategoriesController(IGenericRepository<Category> categoryRepo, IMapper mapper)
    {
        _categoryRepo = categoryRepo;
        _mapper = mapper;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> GetCategories()
    {
        var spec = new CategoriesWithSubCategoriesSpec();
        var categories = await _categoryRepo.ListAsync(spec);
        return Ok(_mapper.Map<IReadOnlyList<CategoryDto>>(categories));
    }
}
