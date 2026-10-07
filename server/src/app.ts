import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import transactionRoutes from './routes/transactionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import budgetRoutes from './routes/budgetRoutes';
import savingsGoalRoutes from './routes/savingsGoalRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import notificationRoutes from './routes/notificationRoutes';
import insightRoutes from './routes/insightRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();
app.set("trust proxy", 1);

// ─── Security Middleware ────────────────────────────────────────────────────
app.use(helmet());

const allowedClientOrigins = env.CLIENT_URL
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use( 
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/+$/, '');
      if (
        allowedClientOrigins.includes(normalizedOrigin) ||
        (env.NODE_ENV === 'development' &&
          (normalizedOrigin.startsWith('http://localhost:') || normalizedOrigin.startsWith('http://127.0.0.1:')))
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ──────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests. Please try again in 15 minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 200 : 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a moment before asking again.' },
});

app.use(limiter);
app.use('/api/auth', authLimiter);
app.use('/api/ai', aiLimiter);

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Spendwise AI API is running',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings-goals', savingsGoalRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
