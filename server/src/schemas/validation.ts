import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Transaction type must be INCOME or EXPENSE' }),
  }),
  amount: z.coerce.number().positive('Amount must be a positive number'),
  categoryId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val ?? null)),
  description: z.string().trim().max(500, 'Description cannot exceed 500 characters').optional().nullable(),
  date: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format or ISO datetime')),
});

export const updateTransactionSchema = transactionSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF0000)').optional().nullable(),
});

export const updateCategorySchema = categorySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const budgetSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .min(1)
    .optional()
    .nullable()
    .or(z.literal(''))
    .transform((val) => (val === '' ? null : val ?? null)),
  amount: z.coerce.number().positive('Budget amount must be positive'),
  period: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']).default('MONTHLY'),
  startDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .default(() => new Date().toISOString().split('T')[0]),
  endDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable(),
});

export const updateBudgetSchema = budgetSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1, 'Goal name is required').max(200),
  targetAmount: z.coerce.number().positive('Target amount must be positive'),
  currentAmount: z.coerce.number().min(0).optional().default(0),
  targetDate: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional()
    .nullable(),
});

export const updateSavingsGoalSchema = savingsGoalSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const aiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(5000),
});

export const aiChatSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters'),
  conversationHistory: z.array(aiChatMessageSchema).max(20).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type SavingsGoalInput = z.infer<typeof savingsGoalSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiChatMessageInput = z.infer<typeof aiChatMessageSchema>;

