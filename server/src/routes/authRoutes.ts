import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me - requires auth
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout - requires auth
router.post('/logout', authenticate, authController.logout);

export default router;
