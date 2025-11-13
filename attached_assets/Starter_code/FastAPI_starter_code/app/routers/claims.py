from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from ..core.db import get_db
from .. import models
from ..schemas import ClaimCreate, ClaimOut

router = APIRouter(prefix="/api/claims", tags=["claims"])

@router.get("/{id}", response_model=ClaimOut)
def get_claim(id: str, db: Session = Depends(get_db)):
    c = db.query(models.Claim).get(id)
    if not c:
        raise HTTPException(status_code=404, detail="not found")
    return ClaimOut(id=c.id, policyId=c.policy_id, amount=c.amount, description=c.description, status=c.status, createdAt=c.created_at)

@router.post("", response_model=ClaimOut, status_code=201)
def submit_claim(payload: ClaimCreate, db: Session = Depends(get_db)):
    p = db.query(models.Policy).filter(models.Policy.policy_number == payload.policyNumber).first()
    if not p:
        raise HTTPException(status_code=400, detail="policy not found")
    c = models.Claim(id=str(uuid4()), policy_id=p.id, amount=payload.amount, description=payload.description or '', status='pending')
    db.add(c); db.commit(); db.refresh(c)
    return ClaimOut(id=c.id, policyId=c.policy_id, amount=c.amount, description=c.description, status=c.status, createdAt=c.created_at)


