from fastapi import APIRouter
from ..schemas import UnderwritingRequest, UnderwritingResult
from ..services.underwriting import evaluate_risk

router = APIRouter(prefix="/api/underwriting", tags=["underwriting"])

@router.post("/evaluate", response_model=UnderwritingResult)
def evaluate(req: UnderwritingRequest):
    return evaluate_risk(req.age, req.product, req.priorClaims)


