from sqlalchemy import Column, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from .core.db import Base

class Customer(Base):
    __tablename__ = 'customers'
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String)
    policies = relationship('Policy', back_populates='customer')

class Policy(Base):
    __tablename__ = 'policies'
    id = Column(String, primary_key=True)
    policy_number = Column(String, unique=True, nullable=False)
    type = Column(String, nullable=False)
    premium = Column(Float, nullable=False)
    coverage = Column(Float, nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String, default='pending')
    customer_id = Column(String, ForeignKey('customers.id'), nullable=False)
    customer = relationship('Customer', back_populates='policies')
    claims = relationship('Claim', back_populates='policy')

class Claim(Base):
    __tablename__ = 'claims'
    id = Column(String, primary_key=True)
    policy_id = Column(String, ForeignKey('policies.id'), nullable=False)
    policy = relationship('Policy', back_populates='claims')
    amount = Column(Float, nullable=False)
    description = Column(String)
    status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)


