from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import uuid4
from ..core.db import get_db
from .. import models
from ..schemas import CustomerCreate, CustomerOut

router = APIRouter(prefix="/api/customers", tags=["customers"])

@router.get("", response_model=list[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return [CustomerOut.model_validate(c) for c in db.query(models.Customer).all()]

@router.post("", response_model=CustomerOut, status_code=201)
def register_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    c = models.Customer(id=str(uuid4()), email=payload.email, name=payload.name, phone=payload.phone)
    db.add(c); db.commit(); db.refresh(c)
    return CustomerOut.model_validate(c)


