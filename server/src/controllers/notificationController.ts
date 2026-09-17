import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as notificationService from '../services/notificationService';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notifications = await notificationService.listNotifications(req.user!.id);
    sendSuccess(res, { notifications });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const notification = await notificationService.markAsRead(req.params.id as string, req.user!.id);
    sendSuccess(res, { notification }, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await notificationService.deleteNotification(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Notification deleted.');
  } catch (error) {
    next(error);
  }
}
