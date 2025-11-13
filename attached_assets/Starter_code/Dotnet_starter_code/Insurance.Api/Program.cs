using Insurance.Api;
using Insurance.Api.Data;
using Insurance.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Config
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? "Host=localhost;Port=5434;Database=insurance;Username=postgres;Password=postgres";

// Services
builder.Services.AddDbContext<InsuranceDbContext>(opt =>
    opt.UseNpgsql(connectionString));
builder.Services.AddScoped<UnderwritingService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

// Apply migrations on startup (optional for demo)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<InsuranceDbContext>();
    db.Database.EnsureCreated();
}

app.Run();

public partial class Program { }


