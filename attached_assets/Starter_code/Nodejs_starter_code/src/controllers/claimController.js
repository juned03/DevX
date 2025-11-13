import { prisma } from '../config/db.js';

export async function getClaimById(req, res, next) {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id }, include: { policy: true } });
    if (!claim) return res.status(404).json({ message: 'Not found' });
    res.json(claim);
  } catch (e) { next(e); }
}

export async function submitClaim(req, res, next) {
  try {
    const { policyId, amount, description } = req.body;
    const claim = await prisma.claim.create({ data: { policyId, amount, description, status: 'pending' } });
    res.status(201).json(claim);
  } catch (e) { next(e); }
}


