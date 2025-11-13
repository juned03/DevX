import { Router } from 'express';
import { getClaimById, submitClaim } from '../controllers/claimController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/:id', getClaimById); // GET /api/claims/:id
router.post('/', requireAuth, submitClaim); // POST /api/claims
export default router;


