import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode = 200): void {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
}

export function sendError(res: Response, message: string, statusCode = 400, error?: string): void {
  const response: ApiResponse = { success: false, message, error };
  res.status(statusCode).json(response);
}

export function getPaginationParams(query: Record<string, unknown>): { page: number; limit: number; skip: number } {
  const parsedPage = parseInt(String(query.page ?? '1'), 10);
  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1;
  const parsedLimit = parseInt(String(query.limit ?? '20'), 10);
  const limit = Number.isInteger(parsedLimit) && parsedLimit >= 1 ? Math.min(100, parsedLimit) : 20;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
