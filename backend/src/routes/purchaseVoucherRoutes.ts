import { Router } from 'express';
import {
  getPurchaseVouchers,
  createPurchaseVoucher,
  getPurchaseVoucherDetail
} from '../controllers/purchaseVoucherController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all purchase voucher endpoints
router.use(authenticateToken);

router.get('/', getPurchaseVouchers);
router.post('/', createPurchaseVoucher);
router.get('/:id', getPurchaseVoucherDetail);

export default router;
