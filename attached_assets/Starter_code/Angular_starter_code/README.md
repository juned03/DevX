# Insurance Portal – Angular Starter (Golden Repo Template)

Production-ready Angular starter for Insurance domain apps. Includes domain features (Policies, Claims, Customers, Underwriting, Reports), role-based guard, HTTP API service, seed data, Jest tests, Docker, and a json-server mock API.

## Tech
- Angular 18 (standalone, lazy-loaded routes)
- Router, HttpClient
- Jest (ts-jest)
- Docker (multi-stage) + Nginx SPA

## Structure
```
Angular_starter_code/
  src/
    app/
      core/
        auth/           # AuthService + canActivateRole guard
        api/            # ApiService (example endpoints)
        dashboard/      # DashboardComponent
      features/
        policies/       # list/create sample UI
        claims/         # submission + table
        customers/      # registry table
        underwriting/   # risk evaluation widget (guarded)
        reports/        # analytics/compliance placeholder
      shared/models/    # Policy model
      app.component.ts
      app.routes.ts
    assets/
      data/             # insurancePolicies.json, customers.json, claims.json
    index.html, styles.css, main.ts
  mock-api/db.json
  angular.json, tsconfig.json, jest.config.cjs
  Dockerfile, docker-compose.yml, nginx.conf
  package.json, .gitignore
```

## Setup
```bash
npm install
npm start
```

## Tests
```bash
npm test
```

## Build
```bash
npm run build
```

## Environment
- API_BASE_URL (default: http://localhost:4000)
- DEFAULT_ROLE (agent | underwriter | admin; default agent)

These are read via `globalThis.env` at runtime (e.g., with Docker Compose). For non-Docker dev, the service defaults to localhost.

## Mock API (json-server)
```bash
docker compose up --build
```
- App: http://localhost:8081
- API: http://localhost:4001

Sample endpoints (expected backend):
- GET /api/policies, POST /api/policies
- GET /api/claims/:id, POST /api/claims
- POST /api/customers
- POST /api/underwriting/evaluate

Note: `ApiService` points to `${API_BASE_URL}/api/*`. The json-server exposes `/policies`, `/claims`, etc. Adjust a proxy or map accordingly for real backends.

## Domain Highlights
- Policies: list and create demo policy
- Claims: submit claim form and table
- Customers: registry list
- Underwriting: protected route; risk evaluation demo
- Reports: analytics/compliance placeholder

## 12-Factor
- Config via env vars
- Dependencies pinned
- Build/run separation (Docker)
- Stateless frontend

MIT
