# Insurance API – Node.js (Express + Prisma)

Production-ready backend starter for Insurance domain. Includes domain endpoints (Policies, Claims, Customers, Underwriting, Reports), Prisma data model, seed script, tests, Docker + Postgres, and 12-factor configuration.

## Tech
- Express 4
- Prisma ORM (Postgres)
- Jest + Supertest
- Docker + docker-compose

## Structure
```
Nodejs_starter_code/
  prisma/
    schema.prisma      # Data model (Customer, Policy, Claim)
    seed.js            # Seed sample data
  src/
    config/db.js       # Prisma client singleton
    middleware/authMiddleware.js
    services/underwritingService.js
    controllers/
      policyController.js
      claimController.js
      customerController.js
      underwritingController.js
      reportController.js
    routes/
      policyRoutes.js  # /api/policies (GET, POST)
      claimRoutes.js   # /api/claims (GET :id, POST)
      customerRoutes.js# /api/customers (GET, POST)
      underwritingRoutes.js # /api/underwriting/evaluate (POST)
      reportRoutes.js  # /api/reports/summary (GET)
    app.js             # Express app
    server.js          # HTTP bootstrap
  tests/
    underwriting.test.js
    health.test.js
  Dockerfile
  docker-compose.yml
  package.json
  .gitignore
  .env.example (see below)
```

## Endpoints
- GET `/health`
- GET `/api/policies`
- POST `/api/policies`
- GET `/api/claims/:id`
- POST `/api/claims`
- GET `/api/customers`
- POST `/api/customers`
- POST `/api/underwriting/evaluate` (requires role `underwriter|admin`)
- GET `/api/reports/summary`

Auth middleware reads role from `x-role` header (demo only) and `DEFAULT_ROLE` when not provided.

## Local Development
```bash
# 1) Install deps
npm install

# 2) Setup DB (docker-compose)
docker compose up -d db

# 3) Apply migrations & seed
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# 4) Run API
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/insurance?schema=public" > .env
npm run dev
```
API on http://localhost:4000

## Running with Docker (API + Postgres)
```bash
docker compose up --build
```
- API: http://localhost:4000
- DB: exposed on 5432

## Environment Variables (.env)
- `PORT` (default 4000)
- `DATABASE_URL` (Postgres URL)
- `JWT_SECRET` (reserved)
- `DEFAULT_ROLE` (agent | underwriter | admin)

## Seed Data
The seed script creates a sample customer, policy, and claim.
```bash
npm run prisma:seed
```

## 12-Factor
- Config via env vars
- Stateless processes
- Dependencies pinned in package.json
- Dev/prod parity via Docker

MIT
