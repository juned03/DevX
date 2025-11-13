using Insurance.Api.Data;
using Insurance.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PoliciesController : ControllerBase
{
    private readonly InsuranceDbContext _db;
    public PoliciesController(InsuranceDbContext db) { _db = db; }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Policy>>> GetAll()
    {
        var list = await _db.Policies.Include(p => p.Customer).ToListAsync();
        return Ok(list);
    }

    public record CreatePolicy(string PolicyNumber, string Type, double Premium, double Coverage, DateOnly StartDate, DateOnly EndDate, string Status, string CustomerEmail);

    [HttpPost]
    public async Task<ActionResult<Policy>> Create([FromBody] CreatePolicy body)
    {
        var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Email == body.CustomerEmail);
        if (customer is null) return BadRequest(new { message = "Customer not found" });
        var p = new Policy
        {
            PolicyNumber = body.PolicyNumber,
            Type = body.Type,
            Premium = body.Premium,
            Coverage = body.Coverage,
            StartDate = body.StartDate,
            EndDate = body.EndDate,
            Status = body.Status,
            Customer = customer
        };
        _db.Policies.Add(p);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = p.Id }, p);
    }
}


