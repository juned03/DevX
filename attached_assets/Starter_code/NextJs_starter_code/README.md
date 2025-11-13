# Insurance Portal – Next.js Starter (Golden Repo Template)

Production-ready Next.js (App Router) starter for Insurance domain apps. Includes domain pages (Policies, Claims, Customers, Underwriting, Reports), API routes, role-based auth context, sample data, tests, and Docker.

## Tech
- Next.js 14 (App Router, API routes)
- React 18
- TypeScript
- Jest + Testing Library

## Structure
```
NextJs_starter_code/
  src/
    app/
      api/
        policies/route.ts            # GET/POST
        claims/route.ts              # POST
        claims/[id]/route.ts         # GET by id
        customers/route.ts           # GET/POST
        underwriting/evaluate/route.ts# POST
        reports/summary/route.ts     # GET
      policies/page.tsx
      claims/page.tsx
      customers/page.tsx
      underwriting/page.tsx
      reports/page.tsx
      layout.tsx, page.tsx, globals.css
    components/ (Navbar, PolicyCard, ClaimForm, UnderwritingWidget)
    context/AuthContext.tsx
    services/api.ts
    data/ (insurancePolicies.json, customers.json, claims.json)
    __tests__/PolicyCard.test.tsx, setupTests.ts
  Dockerfile, package.json, tsconfig.json, next.config.mjs, .gitignore, .env.example
```

## Setup
```bash
npm install
npm run dev
```

## Tests
```bash
npm test
```

## Build
```bash
npm run build && npm start
```

## Environment
- NEXT_PUBLIC_APP_NAME (default Insurance Portal)
- DEFAULT_ROLE (agent | underwriter | admin; default agent)

Create `.env` from `.env.example` and adjust as needed.

## Domain Endpoints (API Routes)
- GET/POST `/api/policies`
- GET `/api/claims/:id`, POST `/api/claims`
- GET/POST `/api/customers`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Notes
- `services/api.ts` uses `fetch` against internal API routes.
- `AuthContext` demonstrates minimal role-based state.
- Integrate a real backend by changing `services/api.ts` to your base URL.

## Docker
```bash
docker build -t insurance-next .
docker run -p 3000:3000 insurance-next
```

MIT
