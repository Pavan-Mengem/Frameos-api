import { Request, Response, NextFunction } from 'express';
import { Role } from '../modules/users/models/userModel';
import { AppError } from '../utils/AppError';

// RBAC guard. Use after authenticate: authorize('owner', 'admin').
export const authorize =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(AppError.unauthorized());
    if (roles.length && !roles.includes(req.user.role)) {
      return next(AppError.forbidden('Insufficient role'));
    }
    next();
  };
