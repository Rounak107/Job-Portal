import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  // fail fast in dev if secret is missing
  // In production, prefer not to crash — but log clearly.
  console.error('JWT_SECRET is not set in environment. Auth will fail.');
}

function stripQuotes(s: string) {
  // remove surrounding single/double quotes if present
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Authorization header keys are normalized to lowercase in Node
    const authHeader = (req.headers.authorization as string) || (req.headers.Authorization as unknown as string);

    if (!authHeader) {
      return res.status(401).json({ message: 'No Authorization header provided' });
    }

    // Accept either: "Bearer <token>" or just "<token>"
    let token = authHeader;

    // If header uses the Bearer scheme, split it
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Token not found in Authorization header' });
    }

    token = stripQuotes(token).trim();

    // Optional debug logging (remove or reduce in production)
    // console.debug('authMiddleware: verifying token:', token.slice(0, 10) + '...');

    // ✅ ADD THIS: Handle dummy-admin token BEFORE JWT verification
    if (token === "dummy-admin") {
      console.log("✅ Dummy admin token detected - granting admin access");
      (req as any).user = { 
        id: 9999, 
        role: "ADMIN",  // Make sure this is "ADMIN" (uppercase)
        email: "admin@jobrun.in", 
        isFakeAdmin: true 
      };
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string; [k: string]: any };

    // Attach user payload to req
    (req as any).user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      // include any other decoded properties if needed
    };

    return next();
  } catch (err: any) {
    console.error('authMiddleware error:', err.message || err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
