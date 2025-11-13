from . import db
from datetime import datetime, date

class Customer(db.Model):
    id = db.Column(db.String, primary_key=True)
    email = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String)
    policies = db.relationship('Policy', backref='customer', lazy=True)

class Policy(db.Model):
    id = db.Column(db.String, primary_key=True)
    policy_number = db.Column(db.String, unique=True, nullable=False)
    type = db.Column(db.String, nullable=False)
    premium = db.Column(db.Float, nullable=False)
    coverage = db.Column(db.Float, nullable=False)
    start_date = db.Column(db.Date, default=date.today)
    end_date = db.Column(db.Date)
    status = db.Column(db.String, default='pending')
    customer_id = db.Column(db.String, db.ForeignKey('customer.id'), nullable=False)
    claims = db.relationship('Claim', backref='policy', lazy=True)

class Claim(db.Model):
    id = db.Column(db.String, primary_key=True)
    policy_id = db.Column(db.String, db.ForeignKey('policy.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    description = db.Column(db.String)
    status = db.Column(db.String, default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


