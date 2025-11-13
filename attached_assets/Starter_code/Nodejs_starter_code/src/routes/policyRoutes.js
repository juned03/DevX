import { Router } from 'express';
import { listPolicies, createPolicy } from '../controllers/policyController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', listPolicies); // GET /api/policies
router.post('/', requireAuth, createPolicy); // POST /api/policies
export default router;


