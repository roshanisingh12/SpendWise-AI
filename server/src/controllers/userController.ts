import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as userService from '../services/userService';
import { updateUserSchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserProfile(req.user!.id);
    sendSuccess(res, { user });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await userService.updateUserProfile(req.user!.id, data);
    sendSuccess(res, { user }, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await userService.deleteUserAccount(req.user!.id);
    sendSuccess(res, null, 'Account deleted successfully.');
  } catch (error) {
    next(error);
  }
}
