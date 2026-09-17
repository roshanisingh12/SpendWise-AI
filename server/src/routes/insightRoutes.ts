import { Router } from 'express';
import * as insightController from '../controllers/insightController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

router.get('/', insightController.list);
router.get('/:id', insightController.getById);
router.delete('/:id', insightController.remove);

export default router;
