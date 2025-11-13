using Insurance.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Insurance.Api.Controllers;

[ApiController]
[Route("api/underwriting")]
public class UnderwritingController : ControllerBase
{
    private readonly UnderwritingService _service;
    public UnderwritingController(UnderwritingService service) { _service = service; }

    public record EvaluateRequest(int Age, string Product, int PriorClaims);

    [HttpPost("evaluate")]
    public ActionResult<object> Evaluate([FromBody] EvaluateRequest body)
    {
        var result = _service.Evaluate(body.Age, body.Product, body.PriorClaims);
        return Ok(result);
    }
}


