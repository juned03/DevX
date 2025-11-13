from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..core.db import get_db
from .. import models

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/summary")
def summary(db: Session = Depends(get_db)):
    policy_count = db.query(models.Policy).count()
    claim_count = db.query(models.Claim).count()
    return { 'policyCount': policy_count, 'claimCount': claim_count }


