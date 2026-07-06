import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/excel', (req: Request, res: Response) => {
  return res.status(501).json({ error: 'Excel export is not implemented in MVP.' });
});

export default router;
