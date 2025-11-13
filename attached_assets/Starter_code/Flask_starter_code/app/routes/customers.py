from flask import Blueprint, request, jsonify
from uuid import uuid4
from .. import db
from ..models import Customer

bp = Blueprint('customers', __name__)

@bp.get('')
def list_customers():
    cs = Customer.query.all()
    return jsonify([{'id': c.id, 'name': c.name, 'email': c.email, 'phone': c.phone} for c in cs])

@bp.post('')
def register_customer():
    data = request.get_json() or {}
    c = Customer(id=str(uuid4()), email=data.get('email'), name=data.get('name'), phone=data.get('phone'))
    db.session.add(c); db.session.commit()
    return jsonify(id=c.id, email=c.email), 201


