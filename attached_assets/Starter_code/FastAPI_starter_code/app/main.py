from fastapi import FastAPI
from .core.db import Base, engine
from .routers import policies, claims, customers, underwriting, reports

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Insurance API")

@app.get("/health")
def health():
    return { "status": "ok" }

app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(customers.router)
app.include_router(underwriting.router)
app.include_router(reports.router)


