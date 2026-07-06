import { Router } from 'express';
import {
  getSuppliers,
  createSupplier,
  getSupplierDetail,
  updateSupplier,
  deleteSupplier,
  recordSupplierPayment
} from '../controllers/supplierController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all supplier endpoints
router.use(authenticateToken);

router.get('/', getSuppliers);
router.post('/', createSupplier);
router.get('/:id', getSupplierDetail);
router.put('/:id', updateSupplier);
router.delete('/:id', deleteSupplier);
router.post('/:id/payments', recordSupplierPayment);

export default router;
