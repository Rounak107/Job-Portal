import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import prisma from "../prisma"; 

export const roleMiddleware = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient role.' });
    }
    next();
  };
};

export async function requireAdmin(req: any, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden — Admins only" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Server error in role check" });
  }
}
