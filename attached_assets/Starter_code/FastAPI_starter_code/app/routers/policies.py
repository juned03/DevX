from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from ..core.db import get_db
from .. import models
from ..schemas import PolicyCreate, PolicyOut

router = APIRouter(prefix="/api/policies", tags=["policies"])

@router.get("", response_model=list[PolicyOut])
def list_policies(db: Session = Depends(get_db)):
    items = db.query(models.Policy).all()
    out: list[PolicyOut] = []
    for p in items:
        out.append(PolicyOut(
            id=p.id, policyNumber=p.policy_number, type=p.type, premium=p.premium, coverage=p.coverage,
            startDate=p.start_date, endDate=p.end_date, status=p.status, customerId=p.customer_id
        ))
    return out

@router.post("", response_model=PolicyOut, status_code=201)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).get(payload.customerId)
    if not customer:
        raise HTTPException(status_code=400, detail="customer not found")
    p = models.Policy(
        id=str(uuid4()), policy_number=payload.policyNumber, type=payload.type, premium=payload.premium,
        coverage=payload.coverage, start_date=payload.startDate, end_date=payload.endDate,
        status=payload.status, customer_id=payload.customerId
    )
    db.add(p); db.commit(); db.refresh(p)
    return PolicyOut(id=p.id, policyNumber=p.policy_number, type=p.type, premium=p.premium, coverage=p.coverage,
                     startDate=p.start_date, endDate=p.end_date, status=p.status, customerId=p.customer_id)


