# Insurance API – Flask Starter (Golden Repo Template)

Production-ready Flask starter for Insurance domain. Includes blueprints for Policies, Claims, Customers, Underwriting, Reports; SQLAlchemy models; pytest; Docker + Postgres.

## Tech
- Flask 3, SQLAlchemy, Flask-Migrate
- Postgres (via docker-compose) or SQLite for local
- pytest

## Structure
```
Flask_starter_code/
  app/
    __init__.py               # app factory, DB init, blueprints
    models.py                 # Customer, Policy, Claim
    routes/
      policies.py             # /api/policies (GET, POST)
      claims.py               # /api/claims (GET :id, POST)
      customers.py            # /api/customers (GET, POST)
      underwriting.py         # /api/underwriting/evaluate (POST)
      reports.py              # /api/reports/summary (GET)
    services/underwriting.py  # risk evaluation logic
  tests/test_health.py
  requirements.txt
  Dockerfile, docker-compose.yml
  wsgi.py
  .gitignore
```

## Endpoints
- GET `/health`
- GET `/api/policies`, POST `/api/policies`
- GET `/api/claims/<id>`, POST `/api/claims`
- GET `/api/customers`, POST `/api/customers`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Local Dev (SQLite by default)
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
flask --app wsgi run -p 4000
```

To use Postgres, set `DATABASE_URL`:
```
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5435/insurance
```

## Docker
```bash
docker compose up --build
```
- API: http://localhost:4000
- DB: Postgres on 5435

## Tests
```bash
pytest
```

## 12-Factor
- Config via environment (DATABASE_URL)
- Stateless app; DB as backing service
- Dependencies pinned in `requirements.txt`

MIT
