import { Router } from 'express';
import { listCustomers, registerCustomer } from '../controllers/customerController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', listCustomers); // GET /api/customers
router.post('/', requireAuth, registerCustomer); // POST /api/customers
export default router;


