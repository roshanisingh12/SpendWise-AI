import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import * as categoryService from '../services/categoryService';
import { categorySchema, updateCategorySchema } from '../schemas/validation';
import { sendSuccess } from '../utils/response';

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await categoryService.listCategories(req.user!.id);
    sendSuccess(res, { categories });
  } catch (error) {
    next(error);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = categorySchema.parse(req.body);
    const category = await categoryService.createCategory(req.user!.id, data);
    sendSuccess(res, { category }, 'Category created.', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateCategorySchema.parse(req.body);
    const category = await categoryService.updateCategory(req.params.id as string, req.user!.id, data);
    sendSuccess(res, { category }, 'Category updated.');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await categoryService.deleteCategory(req.params.id as string, req.user!.id);
    sendSuccess(res, null, 'Category deleted.');
  } catch (error) {
    next(error);
  }
}
