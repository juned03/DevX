namespace Insurance.Api.Models;

public class Claim
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PolicyId { get; set; } = default!;
    public Policy Policy { get; set; } = default!;
    public double Amount { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "pending"; // approved | pending | declined
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}


