import { Router } from 'express';
import * as savingsGoalController from '../controllers/savingsGoalController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/', savingsGoalController.list);
router.post('/', savingsGoalController.create);
router.get('/:id', savingsGoalController.getById);
router.patch('/:id', savingsGoalController.update);
router.delete('/:id', savingsGoalController.remove);

export default router;
