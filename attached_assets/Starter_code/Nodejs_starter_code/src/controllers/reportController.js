import { prisma } from '../config/db.js';

export async function summary(req, res, next) {
  try {
    const [policyCount, claimCount] = await Promise.all([
      prisma.policy.count(),
      prisma.claim.count()
    ]);
    res.json({ policyCount, claimCount });
  } catch (e) { next(e); }
}


