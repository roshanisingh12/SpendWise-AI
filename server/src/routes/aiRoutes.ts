import { Router } from 'express';
import * as aiController from '../controllers/aiController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All AI routes require authentication
router.use(authenticate);

router.post('/chat', aiController.chat);
router.get('/suggestions', aiController.getSuggestions);

export default router;
