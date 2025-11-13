from pydantic import BaseModel, EmailStr
from datetime import date, datetime

class CustomerCreate(BaseModel):
    email: EmailStr
    name: str
    phone: str | None = None

class CustomerOut(BaseModel):
    id: str
    email: EmailStr
    name: str
    phone: str | None = None
    class Config:
        from_attributes = True

class PolicyCreate(BaseModel):
    policyNumber: str
    type: str
    premium: float
    coverage: float
    startDate: date
    endDate: date
    status: str
    customerId: str

class PolicyOut(BaseModel):
    id: str
    policyNumber: str
    type: str
    premium: float
    coverage: float
    startDate: date | None = None
    endDate: date | None = None
    status: str
    customerId: str
    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    policyNumber: str
    amount: float
    description: str | None = None

class ClaimOut(BaseModel):
    id: str
    policyId: str
    amount: float
    description: str | None = None
    status: str
    createdAt: datetime
    class Config:
        from_attributes = True

class UnderwritingRequest(BaseModel):
    age: int
    product: str
    priorClaims: int

class UnderwritingResult(BaseModel):
    riskScore: int
    decision: str


