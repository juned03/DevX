using Insurance.Api.Data;
using Insurance.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly InsuranceDbContext _db;
    public CustomersController(InsuranceDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetAll()
        => Ok(await _db.Customers.Include(c => c.Policies).ToListAsync());

    public record RegisterCustomer(string Email, string Name, string? Phone);

    [HttpPost]
    public async Task<ActionResult<Customer>> Register([FromBody] RegisterCustomer body)
    {
        var c = new Customer { Email = body.Email, Name = body.Name, Phone = body.Phone };
        _db.Customers.Add(c);
        await _db.SaveChangesAsync();
        return Created($"/api/customers/{c.Id}", c);
    }
}


