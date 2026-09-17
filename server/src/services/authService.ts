import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { RegisterInput, LoginInput } from '../schemas/validation';
import * as userRepo from '../repositories/userRepository';
import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export async function register(data: RegisterInput) {
  const existing = await userRepo.findUserByEmail(data.email);
  if (existing) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await userRepo.createUser(data);
  
  // Seed default categories
  const defaultCategories = [
    { name: 'Housing', type: 'EXPENSE' as const, color: '#5078e5' },
    { name: 'Groceries', type: 'EXPENSE' as const, color: '#22a06b' },
    { name: 'Dining', type: 'EXPENSE' as const, color: '#f59e0b' },
    { name: 'Transport', type: 'EXPENSE' as const, color: '#a855f7' },
    { name: 'Subscriptions', type: 'EXPENSE' as const, color: '#ef6b73' },
    { name: 'Shopping', type: 'EXPENSE' as const, color: '#ef8354' },
    { name: 'Health', type: 'EXPENSE' as const, color: '#10b8b0' },
    { name: 'Education', type: 'EXPENSE' as const, color: '#64748b' },
    { name: 'Entertainment', type: 'EXPENSE' as const, color: '#e879f9' },
    { name: 'Income', type: 'INCOME' as const, color: '#22a06b' },
  ];
  
  await Promise.all(
    defaultCategories.map(cat => 
      prisma.category.create({
        data: { ...cat, userId: user.id }
      })
    )
  );

  const token = signToken(user.id, user.email, user.name);

  return { user, token };
}

export async function login(data: LoginInput) {
  const user = await userRepo.findUserByEmail(data.email);
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordValid = await userRepo.verifyPassword(data.password, user.passwordHash);
  if (!passwordValid) {
    throw new AppError('Invalid email or password.', 401);
  }

  // Strip passwordHash before returning
  const { passwordHash: _, ...safeUser } = user;
  const token = signToken(safeUser.id, safeUser.email, safeUser.name);

  return { user: safeUser, token };
}

export async function getMe(userId: string) {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw new AppError('User not found.', 404);
  }
  return user;
}

function signToken(userId: string, email: string, name: string): string {
  return jwt.sign(
    { userId, email, name },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}
