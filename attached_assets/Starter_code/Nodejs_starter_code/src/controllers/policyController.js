import { prisma } from '../config/db.js';

export async function listPolicies(req, res, next) {
  try {
    const policies = await prisma.policy.findMany({ include: { customer: true } });
    res.json(policies);
  } catch (e) { next(e); }
}

export async function createPolicy(req, res, next) {
  try {
    const { policyNumber, type, premium, coverage, startDate, endDate, status, customerId } = req.body;
    const policy = await prisma.policy.create({ data: { policyNumber, type, premium, coverage, startDate: new Date(startDate), endDate: new Date(endDate), status, customerId } });
    res.status(201).json(policy);
  } catch (e) { next(e); }
}


