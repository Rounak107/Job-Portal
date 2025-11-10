import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment. Auth will fail.');
}

function stripQuotes(s: string) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = (req.headers.authorization as string) || (req.headers.Authorization as unknown as string);

    if (!authHeader) {
      return res.status(401).json({ message: 'No Authorization header provided' });
    }

    let token = authHeader;

    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Token not found in Authorization header' });
    }

    token = stripQuotes(token).trim();

    // ✅ ADD EMAIL VERIFICATION for dummy-admin
    if (token === "dummy-admin") {
      const ALLOWED_ADMINS = ["rajugroupinfo@gmail.com", "rounakbhuiya@gmail.com"];
      
      // Get admin email from frontend header
      const adminEmailHeader = req.headers['x-admin-email'] as string;
      
      if (!adminEmailHeader || !ALLOWED_ADMINS.includes(adminEmailHeader)) {
        console.log("❌ Unauthorized admin access attempt:", adminEmailHeader);
        return res.status(403).json({ message: 'Admin access denied' });
      }

      console.log("✅ Admin access granted to:", adminEmailHeader);
      (req as any).user = { 
        id: 9999, 
        role: "ADMIN",
        email: adminEmailHeader,
        isFakeAdmin: true 
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string; [k: string]: any };

    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err: any) {
    console.error('authMiddleware error:', err.message || err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};