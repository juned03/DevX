import { evaluateRisk } from '../services/underwritingService.js';

export async function evaluate(req, res, next) {
  try {
    const result = evaluateRisk(req.body || {});
    res.json(result);
  } catch (e) { next(e); }
}


