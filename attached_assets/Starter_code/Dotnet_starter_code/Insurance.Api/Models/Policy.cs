namespace Insurance.Api.Models;

public class Policy
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string PolicyNumber { get; set; } = default!;
    public string Type { get; set; } = default!; // auto | home | life
    public double Premium { get; set; }
    public double Coverage { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "pending"; // active | pending | lapsed

    public string CustomerId { get; set; } = default!;
    public Customer Customer { get; set; } = default!;
    public List<Claim> Claims { get; set; } = new();
}


