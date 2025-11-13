using Insurance.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Insurance.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly InsuranceDbContext _db;
    public ReportsController(InsuranceDbContext db) { _db = db; }

    [HttpGet("summary")]
    public async Task<ActionResult<object>> Summary()
    {
        var policyCount = await _db.Policies.CountAsync();
        var claimCount = await _db.Claims.CountAsync();
        return Ok(new { policyCount, claimCount });
    }
}


