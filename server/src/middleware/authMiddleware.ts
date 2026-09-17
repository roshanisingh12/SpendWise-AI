import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types';
import { sendError } from '../utils/response';

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please provide a Bearer token.', 401);
    return;
  }

  const token = authHeader.substring(7);

  if (!token) {
    sendError(res, 'Authentication token is missing.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 'Authentication token has expired. Please log in again.', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Authentication token is invalid.', 401);
    } else {
      sendError(res, 'Authentication failed.', 401);
    }
  }
}
