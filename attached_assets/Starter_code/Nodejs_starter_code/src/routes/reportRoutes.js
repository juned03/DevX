import { Router } from 'express';
import { summary } from '../controllers/reportController.js';

const router = Router();
router.get('/summary', summary); // GET /api/reports/summary
export default router;


