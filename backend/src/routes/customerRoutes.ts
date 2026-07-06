import { Router } from 'express';
import {
  getCustomers,
  createCustomer,
  getCustomerDetail,
  updateCustomer,
  deleteCustomer,
  recordCustomerPayment
} from '../controllers/customerController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all customer endpoints
router.use(authenticateToken);

router.get('/', getCustomers);
router.post('/', createCustomer);
router.get('/:id', getCustomerDetail);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.post('/:id/payments', recordCustomerPayment);

export default router;
