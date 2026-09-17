import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me
router.get('/me', userController.getProfile);

// PATCH /api/users/me
router.patch('/me', userController.updateProfile);

// DELETE /api/users/me
router.delete('/me', userController.deleteAccount);

export default router;
