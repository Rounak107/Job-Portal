// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail } from '../services/emailService';

const JWT_SECRET = process.env.JWT_SECRET!;

// Register
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // fire-and-forget (doesn't block response)
    try { sendWelcomeEmail(user.email, user.name); } catch (e) {}

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error: any) {
    console.error('registerUser error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ✅ Increment loginCount
    await prisma.user.update({
      where: { id: user.id },
      data: { loginCount: { increment: 1 } },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        loginCount: user.loginCount + 1, // return updated count in response
      },
    });
  } catch (error: any) {
    console.error('loginUser error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Return current authenticated user (protected)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const current = (req as any).user;
    if (!current) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        loginCount: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err: any) {
    console.error('getCurrentUser error:', err);
    return res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// User Dashboard
export const getUserDashboard = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const totalApplications = await prisma.application.count({ where: { userId } });
    const pending = await prisma.application.count({ where: { userId, status: 'PENDING' } });
    const shortlisted = await prisma.application.count({ where: { userId, status: 'SHORTLISTED' } });
    const rejected = await prisma.application.count({ where: { userId, status: 'REJECTED' } });
    const recentApplications = await prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    res.json({
      totalApplications,
      byStatus: { pending, shortlisted, rejected },
      recentApplications,
    });
  } catch (err: any) {
    console.error('getUserDashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard', error: err.message });
  }
};
