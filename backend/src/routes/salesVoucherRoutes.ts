import { Router } from 'express';
import {
  getSalesVouchers,
  createSalesVoucher,
  getSalesVoucherDetail,
  getInvoicePDF
} from '../controllers/salesVoucherController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all sales voucher endpoints
router.use(authenticateToken);

router.get('/', getSalesVouchers);
router.post('/', createSalesVoucher);
router.get('/:id', getSalesVoucherDetail);
router.get('/:id/invoice-pdf', getInvoicePDF);

export default router;
