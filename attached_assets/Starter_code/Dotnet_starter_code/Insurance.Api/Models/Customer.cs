namespace Insurance.Api.Models;

public class Customer
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Email { get; set; } = default!;
    public string Name { get; set; } = default!;
    public string? Phone { get; set; }
    public List<Policy> Policies { get; set; } = new();
}


