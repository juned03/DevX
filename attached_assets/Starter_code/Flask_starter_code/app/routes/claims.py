from flask import Blueprint, request, jsonify
from uuid import uuid4
from .. import db
from ..models import Claim, Policy

bp = Blueprint('claims', __name__)

@bp.get('/<id>')
def get_claim(id: str):
    c = Claim.query.get(id)
    if not c:
        return jsonify(message='not found'), 404
    return jsonify(id=c.id, policyId=c.policy_id, amount=c.amount, status=c.status, description=c.description)

@bp.post('')
def submit_claim():
    data = request.get_json() or {}
    policy_number = data.get('policyNumber')
    policy = Policy.query.filter_by(policy_number=policy_number).first()
    if not policy:
        return jsonify(message='policy not found'), 400
    c = Claim(id=str(uuid4()), policy_id=policy.id, amount=float(data.get('amount',0)), description=data.get('description',''), status='pending')
    db.session.add(c); db.session.commit()
    return jsonify(id=c.id, status=c.status, policyId=c.policy_id), 201


