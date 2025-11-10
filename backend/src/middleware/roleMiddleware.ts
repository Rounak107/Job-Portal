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
    if (req.user?.isFakeAdmin && req.user.role === "ADMIN") {
      console.log("✅ Fake admin access granted");
      return next();
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user || user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden — Admins only" });
    }

    req.user = user; // attach fresh user with role
    next();
  } catch (err) {
    console.error("requireAdmin failed", err);
    res.status(500).json({ error: "Server error in role check" });
  }
}
