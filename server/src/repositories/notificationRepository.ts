import { prisma } from '../config/prisma';

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findNotificationById(id: string, userId: string) {
  return prisma.notification.findFirst({ where: { id, userId } });
}

export async function markNotificationRead(id: string) {
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function deleteNotification(id: string) {
  return prisma.notification.delete({ where: { id } });
}
