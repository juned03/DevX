from flask import Blueprint, request, jsonify
from uuid import uuid4
from .. import db
from ..models import Policy, Customer
from datetime import date

bp = Blueprint('policies', __name__)

@bp.get('')
def list_policies():
    policies = Policy.query.all()
    def to_json(p: Policy):
        return {
            'id': p.id, 'policyNumber': p.policy_number, 'type': p.type,
            'premium': p.premium, 'coverage': p.coverage,
            'startDate': p.start_date.isoformat() if p.start_date else None,
            'endDate': p.end_date.isoformat() if p.end_date else None,
            'status': p.status,
            'customerId': p.customer_id
        }
    return jsonify([to_json(p) for p in policies])

@bp.post('')
def create_policy():
    data = request.get_json() or {}
    customer_id = data.get('customerId')
    if not customer_id:
        return jsonify(message='customerId is required'), 400
    if not Customer.query.get(customer_id):
        return jsonify(message='customer not found'), 400
    p = Policy(
        id=str(uuid4()),
        policy_number=data.get('policyNumber') or f"POL-{str(uuid4())[:8]}",
        type=data.get('type','auto'),
        premium=float(data.get('premium',0)),
        coverage=float(data.get('coverage',0)),
        start_date=date.fromisoformat(data.get('startDate','2025-01-01')),
        end_date=date.fromisoformat(data.get('endDate','2026-01-01')),
        status=data.get('status','pending'),
        customer_id=customer_id
    )
    db.session.add(p); db.session.commit()
    return jsonify(id=p.id, policyNumber=p.policy_number), 201


