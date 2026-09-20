import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  void _next;
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Prisma known errors
  if ('code' in err) {
    const prismaError = err as { code: string; meta?: { target?: string[]; field_name?: string } };
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] ?? 'field';
      res.status(409).json({
        success: false,
        message: `A record with this ${field} already exists.`,
      });
      return;
    }
    if (prismaError.code === 'P2025' || prismaError.code === 'P2018') {
      res.status(404).json({
        success: false,
        message: 'Record not found.',
      });
      return;
    }
    if (prismaError.code === 'P2003') {
      res.status(400).json({
        success: false,
        message: 'Invalid reference: a related record does not exist.',
      });
      return;
    }
    if (prismaError.code === 'P2014') {
      res.status(400).json({
        success: false,
        message: 'The request violates a required relation constraint.',
      });
      return;
    }
  }

  // Unhandled errors — don't leak internals in production
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    ...(env.NODE_ENV === 'development' && { error: err.message, stack: err.stack }),
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: 'The requested endpoint does not exist.',
  });
}
