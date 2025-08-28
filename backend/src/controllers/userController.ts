// backend/src/controllers/userController.ts
import { Request, Response } from 'express';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendWelcomeEmail,  sendPasswordResetEmail } from '../services/emailService';


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

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success message (do not reveal whether email exists)
    if (user) {
      try {
        // token expires in 1 hour
        const token = jwt.sign({ id: user.id, type: 'pwd_reset' }, JWT_SECRET, { expiresIn: '1h' });
        const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
        const resetUrl = `${frontendBase}/reset-password?token=${encodeURIComponent(token)}`;

        // Fire-and-forget email
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (e) {
        console.error('Error sending password reset email:', e);
        // don't send error to client (still return generic success)
      }
    }

    return res.json({ message: 'If that email exists in our system, a password reset link was sent.' });
  } catch (err: any) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: 'Failed to process request', error: err.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET) as any;
    } catch (e: any) {
      console.error('resetPassword token verify failed:', e);
      return res.status(400).json({ message: e?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
    }

    if (payload.type !== 'pwd_reset' || !payload.id) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const userId = payload.id as number;

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return res.json({ message: 'Password has been reset successfully' });
  } catch (err: any) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Failed to reset password', error: err.message });
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

// --- PROFILE: Get my profile ---
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    if (!me) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: me.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        phone: true,
        location: true,
        skills: true,
        experience: true,
        education: true,
        profilePic: true,
        resumeUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ profile: user });
  } catch (err: any) {
    console.error('getMyProfile error:', err);
    return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// --- PROFILE: Update my profile ---
export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    if (!me) return res.status(401).json({ message: 'Unauthorized' });

    // allow only these fields to be updated via JSON
    const {
      name,
      bio,
      phone,
      location,
      skills,      // accept comma-separated string
      experience,
      education,
    } = req.body || {};

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(skills !== undefined ? { skills } : {}),
        ...(experience !== undefined ? { experience } : {}),
        ...(education !== undefined ? { education } : {}),
      },
      select: {
        id: true, name: true, email: true, role: true,
        bio: true, phone: true, location: true, skills: true,
        experience: true, education: true, profilePic: true, resumeUrl: true,
        updatedAt: true,
      },
    });

    return res.json({ profile: updated });
  } catch (err: any) {
    console.error('updateMyProfile error:', err);
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
};

// --- PROFILE: Get a user's profile by id (self OR recruiter/admin) ---
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const current = (req as any).user;
    if (!current) return res.status(401).json({ message: 'Unauthorized' });

    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'Invalid user id' });

    // allow if current user is the same, or recruiter/admin
    const isSelf = current.id === userId;
    const isElevated = current.role === 'RECRUITER' || current.role === 'ADMIN';
    if (!isSelf && !isElevated) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        bio: true,
        phone: true,
        location: true,
        skills: true,
        experience: true,
        education: true,
        profilePic: true,
        resumeUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ profile: user });
  } catch (err: any) {
    console.error('getUserProfile error:', err);
    return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// --- PROFILE: Upload avatar ---
export const uploadMyAvatar = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    if (!me) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relPath = `/uploads/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { profilePic: relPath },
      select: { id: true, profilePic: true },
    });

    return res.json({ profilePic: updated.profilePic });
  } catch (err: any) {
    console.error('uploadMyAvatar error:', err);
    return res.status(500).json({ message: 'Failed to upload avatar', error: err.message });
  }
};

// --- PROFILE: Upload resume (user-level) ---
export const uploadMyResume = async (req: Request, res: Response) => {
  try {
    const me = (req as any).user;
    if (!me) return res.status(401).json({ message: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const relPath = `/uploads/${req.file.filename}`;
    const updated = await prisma.user.update({
      where: { id: me.id },
      data: { resumeUrl: relPath },
      select: { id: true, resumeUrl: true },
    });

    return res.json({ resumeUrl: updated.resumeUrl });
  } catch (err: any) {
    console.error('uploadMyResume error:', err);
    return res.status(500).json({ message: 'Failed to upload resume', error: err.message });
  }
};
