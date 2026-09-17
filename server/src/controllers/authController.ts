import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as authService from '../services/authService';
import { registerSchema, loginSchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function register(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.register(data);
    sendSuccess(res, result, 'Account created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

export async function login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data);
    sendSuccess(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

export function logout(_req: AuthenticatedRequest, res: Response): void {
  // JWT-based logout — client discards token. Could implement a token denylist here.
  sendSuccess(res, null, 'Logged out successfully.');
}
