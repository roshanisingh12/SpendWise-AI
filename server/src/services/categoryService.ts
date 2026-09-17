import { CategoryInput } from '../schemas/validation';
import * as repo from '../repositories/categoryRepository';
import { AppError } from '../middleware/errorHandler';

export async function listCategories(userId: string) {
  return repo.listCategories(userId);
}

export async function getCategory(id: string, userId: string) {
  const category = await repo.findCategoryById(id, userId);
  if (!category) throw new AppError('Category not found.', 404);
  return category;
}

export async function createCategory(userId: string, data: CategoryInput) {
  return repo.createCategory(userId, data);
}

export async function updateCategory(id: string, userId: string, data: Partial<CategoryInput>) {
  const existing = await repo.findCategoryById(id, userId);
  if (!existing) throw new AppError('Category not found.', 404);
  return repo.updateCategory(id, data);
}

export async function deleteCategory(id: string, userId: string) {
  const existing = await repo.findCategoryById(id, userId);
  if (!existing) throw new AppError('Category not found.', 404);
  return repo.deleteCategory(id);
}
