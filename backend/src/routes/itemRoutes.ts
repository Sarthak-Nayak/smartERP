import { Router } from 'express';
import {
  getItems,
  createItem,
  getItemDetail,
  updateItem,
  deleteItem
} from '../controllers/itemController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Apply auth middleware to all item endpoints
router.use(authenticateToken);

router.get('/', getItems);
router.post('/', createItem);
router.get('/:id', getItemDetail);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

export default router;
