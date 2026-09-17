import * as repo from '../repositories/notificationRepository';
import { AppError } from '../middleware/errorHandler';

export async function listNotifications(userId: string) {
  return repo.listNotifications(userId);
}

export async function markAsRead(id: string, userId: string) {
  const notification = await repo.findNotificationById(id, userId);
  if (!notification) throw new AppError('Notification not found.', 404);
  return repo.markNotificationRead(id);
}

export async function deleteNotification(id: string, userId: string) {
  const notification = await repo.findNotificationById(id, userId);
  if (!notification) throw new AppError('Notification not found.', 404);
  return repo.deleteNotification(id);
}
