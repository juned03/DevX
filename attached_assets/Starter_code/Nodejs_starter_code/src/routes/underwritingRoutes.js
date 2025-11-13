import { Router } from 'express';
import { evaluate } from '../controllers/underwritingController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
router.post('/evaluate', requireAuth, requireRole(['underwriter', 'admin']), evaluate); // POST /api/underwriting/evaluate
export default router;


