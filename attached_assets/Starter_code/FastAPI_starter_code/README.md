# Insurance API – FastAPI Starter (Golden Repo Template)

Production-ready FastAPI starter for Insurance domain. Includes routers for Policies, Claims, Customers, Underwriting, Reports; SQLAlchemy models; pytest; Docker + Postgres.

## Tech
- FastAPI + Uvicorn
- SQLAlchemy
- Postgres (via docker-compose) or SQLite for local
- pytest

## Structure
```
FastAPI_starter_code/
  app/
    main.py                    # app entry and router includes
    core/
      config.py                # pydantic settings
      db.py                    # engine, session, Base
    models.py                  # Customer, Policy, Claim (SQLAlchemy)
    schemas.py                 # Pydantic DTOs
    services/underwriting.py   # risk evaluation
    routers/
      policies.py              # /api/policies (GET, POST)
      claims.py                # /api/claims (GET :id, POST)
      customers.py             # /api/customers (GET, POST)
      underwriting.py          # /api/underwriting/evaluate (POST)
      reports.py               # /api/reports/summary (GET)
  tests/test_health.py
  requirements.txt
  Dockerfile, docker-compose.yml, .gitignore
```

## Endpoints
- GET `/health`
- GET `/api/policies`, POST `/api/policies`
- GET `/api/claims/{id}`, POST `/api/claims`
- GET `/api/customers`, POST `/api/customers`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Local Dev (SQLite default)
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 4000
```

To use Postgres, set `DATABASE_URL`:
```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5436/insurance
```

## Docker
```bash
docker compose up --build
```
- API: http://localhost:4002
- DB: Postgres on 5436

## Tests
```bash
pytest
```

## 12-Factor
- Config via env (DATABASE_URL)
- Stateless app; DB as backing service
- Dependencies pinned in `requirements.txt`

MIT
