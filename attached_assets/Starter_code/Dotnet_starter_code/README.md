# Insurance API – .NET (ASP.NET Core) Starter

Production-ready ASP.NET Core Web API for Insurance domain. Includes EF Core models, controllers for Policies, Claims, Customers, Underwriting, Reports, Swagger, Docker, and Postgres compose.

## Tech
- .NET 8 Web API
- EF Core + Npgsql (Postgres)
- Swagger/OpenAPI
- Docker + docker-compose

## Structure
```
Dotnet_starter_code/
  Insurance.Api/
    Controllers/ (PoliciesController, ClaimsController, CustomersController, UnderwritingController, ReportsController)
    Data/InsuranceDbContext.cs
    Models/ (Customer, Policy, Claim)
    Services/UnderwritingService.cs
    Program.cs, appsettings.json, Insurance.Api.csproj
  Dockerfile, docker-compose.yml, .gitignore
```

## Endpoints
- GET `/health`
- GET `/api/policies`, POST `/api/policies`
- GET `/api/claims/{id}`, POST `/api/claims`
- GET `/api/customers`, POST `/api/customers`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Run locally
```bash
# Start Postgres
docker compose up -d db

# Run API
cd Insurance.Api
dotnet run
```
API: http://localhost:5085 (or as shown) | Swagger: /swagger

## Docker
```bash
docker compose up --build
```
- API: http://localhost:8082
- Postgres: port 5434

## Config / Env
- Connection string from `appsettings.json` → override with `DATABASE_URL`
- Example: `Host=localhost;Port=5434;Database=insurance;Username=postgres;Password=postgres`

## 12-Factor
- Config via env
- Stateless API; DB as backing service
- Dependencies pinned in csproj

MIT
