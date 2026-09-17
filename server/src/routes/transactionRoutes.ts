import { Router } from 'express';
import * as transactionController from '../controllers/transactionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// GET    /api/transactions  (supports ?type, ?categoryId, ?startDate, ?endDate, ?page, ?limit)
router.get('/', transactionController.list);
// POST   /api/transactions
router.post('/', transactionController.create);
// GET    /api/transactions/:id
router.get('/:id', transactionController.getById);
// PATCH  /api/transactions/:id
router.patch('/:id', transactionController.update);
// DELETE /api/transactions/:id
router.delete('/:id', transactionController.remove);

export default router;
