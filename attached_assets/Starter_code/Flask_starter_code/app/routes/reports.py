from flask import Blueprint, jsonify
from ..models import Policy, Claim

bp = Blueprint('reports', __name__)

@bp.get('/summary')
def summary():
    return jsonify(policyCount=Policy.query.count(), claimCount=Claim.query.count())


