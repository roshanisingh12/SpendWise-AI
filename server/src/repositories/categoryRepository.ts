import { prisma } from '../config/prisma';
import { CategoryInput } from '../schemas/validation';

export async function listCategories(userId: string) {
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

export async function findCategoryById(id: string, userId: string) {
  return prisma.category.findFirst({ where: { id, userId } });
}

export async function createCategory(userId: string, data: CategoryInput) {
  return prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon ?? null,
      color: data.color ?? null,
    },
  });
}

export async function updateCategory(id: string, data: Partial<CategoryInput>) {
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}
