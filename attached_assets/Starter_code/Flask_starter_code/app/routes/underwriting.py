from flask import Blueprint, request, jsonify
from ..services.underwriting import evaluate_risk

bp = Blueprint('underwriting', __name__)

@bp.post('/evaluate')
def evaluate():
    data = request.get_json() or {}
    res = evaluate_risk(int(data.get('age',0)), data.get('product','auto'), int(data.get('priorClaims',0)))
    return jsonify(res)


