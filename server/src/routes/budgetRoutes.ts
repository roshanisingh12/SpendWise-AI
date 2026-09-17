import { Router } from 'express';
import * as budgetController from '../controllers/budgetController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/', budgetController.list);
router.post('/', budgetController.create);
router.get('/:id', budgetController.getById);
router.patch('/:id', budgetController.update);
router.delete('/:id', budgetController.remove);

export default router;
