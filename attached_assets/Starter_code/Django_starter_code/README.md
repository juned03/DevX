# Insurance API – Django (DRF) Starter

Production-ready Django REST Framework starter for Insurance domain. Includes apps and endpoints for Policies, Claims, Customers, Underwriting, and Reports; Docker and Postgres compose; and a health endpoint.

## Tech
- Django 5 + DRF
- PostgreSQL (compose) or SQLite (local)
- pytest-django (optional)

## Structure
```
Django_starter_code/
  manage.py
  insurance_project/
    settings.py, urls.py, wsgi.py
  policies/ (models, serializers, views, urls)
  claims/ (urls)
  customers/ (urls)
  underwriting/ (views, urls)
  reports/ (views, urls)
  requirements.txt, Dockerfile, docker-compose.yml, .gitignore
```

## Endpoints
- GET `/health`
- GET/POST `/api/policies/`
- GET/POST `/api/claims/`
- GET/POST `/api/customers/`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Local Dev (SQLite default)
```bash
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

## Docker
```bash
docker compose up --build
```
- API: http://localhost:8001
- DB: Postgres on 5437

## 12-Factor
- Config via environment in `settings.py` (Postgres env vars)
- Stateless API; DB as backing service
- Dependencies pinned in `requirements.txt`

MIT
