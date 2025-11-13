using Insurance.Api.Data;
using Insurance.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClaimsController : ControllerBase
{
    private readonly InsuranceDbContext _db;
    public ClaimsController(InsuranceDbContext db) { _db = db; }

    [HttpGet("{id}")]
    public async Task<ActionResult<Claim>> GetById(string id)
    {
        var claim = await _db.Claims.Include(c => c.Policy).FirstOrDefaultAsync(c => c.Id == id);
        return claim is null ? NotFound() : Ok(claim);
    }

    public record SubmitClaim(string PolicyNumber, double Amount, string Description);

    [HttpPost]
    public async Task<ActionResult<Claim>> Submit([FromBody] SubmitClaim body)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p => p.PolicyNumber == body.PolicyNumber);
        if (policy is null) return BadRequest(new { message = "Policy not found" });
        var c = new Claim { Policy = policy, Amount = body.Amount, Description = body.Description, Status = "pending" };
        _db.Claims.Add(c);
        await _db.SaveChangesAsync();
        return Created($"/api/claims/{c.Id}", c);
    }
}


