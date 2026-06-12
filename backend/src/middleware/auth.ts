import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthPayload {
  sub: string;
  role: 'super_admin' | 'wedding_admin' | 'guest' | 'dj' | 'photographer';
  weddingId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function requireAuth(roles?: AuthPayload['role'][]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.substring('Bearer '.length);

    try {
      const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
      req.user = payload;

      if (roles && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

