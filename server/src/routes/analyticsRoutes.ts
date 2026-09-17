import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

// GET /api/analytics/summary?year=2026&month=9
router.get('/summary', analyticsController.summary);
// GET /api/analytics/monthly?months=6
router.get('/monthly', analyticsController.monthly);
// GET /api/analytics/categories?startDate=&endDate=
router.get('/categories', analyticsController.categories);
// GET /api/analytics/budget-progress
router.get('/budget-progress', analyticsController.budgetProgress);
// GET /api/analytics/savings-progress
router.get('/savings-progress', analyticsController.savingsProgress);

export default router;
