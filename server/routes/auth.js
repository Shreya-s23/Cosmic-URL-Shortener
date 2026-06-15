import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import UAParser from 'ua-parser-js';
import prisma from '../prisma/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Helper to log user login, logout, and signup telemetry
const logAccess = async (userId, action, req) => {
  try {
    const userAgentStr = req.headers['user-agent'] || '';
    
    // Parse client IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    if (Array.isArray(ip)) ip = ip[0];
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }

    // Parse User Agent
    const parser = new UAParser(userAgentStr);
    const uaResult = parser.getResult();
    const browser = uaResult.browser.name || 'Unknown';
    let device = 'Desktop';
    if (uaResult.device.type) {
      const type = uaResult.device.type;
      device = type.charAt(0).toUpperCase() + type.slice(1);
    }

    await prisma.accessLog.create({
      data: {
        userId,
        action,
        ip,
        userAgent: userAgentStr,
        device,
        browser,
      }
    });
  } catch (error) {
    console.error('Failed to write access log:', error);
  }
};

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.string().optional().default('USER'),
});

router.post('/signup', async (req, res) => {
  try {
    const { email, password, role } = signupSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      },
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'super-secret-space-jwt-key-9988',
      { expiresIn: '7d' }
    );

    // Log the signup event
    await logAccess(user.id, 'SIGNUP', req);

    res.status(201).json({
      token,
      email: user.email,
      role: user.role,
      restricted: user.restricted,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'super-secret-space-jwt-key-9988',
      { expiresIn: '7d' }
    );

    // Log the login event
    await logAccess(user.id, 'LOGIN', req);

    res.status(200).json({
      token,
      email: user.email,
      role: user.role,
      restricted: user.restricted,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Explicit logout API to log session termination
router.post('/logout', requireAuth, async (req, res) => {
  try {
    await logAccess(req.userId, 'LOGOUT', req);
    res.status(200).json({ message: 'Session termination logged' });
  } catch (error) {
    console.error('Logout logging error:', error);
    res.status(500).json({ error: 'Server error logging logout' });
  }
});

// Get user access logs (System Audit Log)
router.get('/access-logs', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.accessLog.findMany({
      include: {
        user: {
          select: { email: true }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 80 // Limit for screen presentation
    });

    const is_admin = req.userRole === 'ADMIN';

    const formattedLogs = logs.map(l => {
      // If user is standard and this log belongs to another user, mask sensitive details
      const isOwner = l.userId === req.userId;
      if (!is_admin && !isOwner) {
        const emailParts = l.user.email.split('@');
        const username = emailParts[0];
        const domain = emailParts[1] || '';
        const maskedUsername = username.length > 2 
          ? username.charAt(0) + '***' + username.charAt(username.length - 1)
          : username.charAt(0) + '***';
        const maskedDomain = domain.length > 3
          ? domain.split('.')[0].charAt(0) + '***.' + domain.split('.').slice(1).join('.')
          : '***';
        
        return {
          id: l.id,
          email: `${maskedUsername}@${maskedDomain}`,
          action: l.action,
          timestamp: l.timestamp,
          ip: '[CONFIDENTIAL]',
          device: '[CONFIDENTIAL]',
          browser: '[CONFIDENTIAL]',
        };
      }

      return {
        id: l.id,
        email: l.user.email,
        action: l.action,
        timestamp: l.timestamp,
        ip: l.ip,
        device: l.device,
        browser: l.browser,
      };
    });

    // Generate telemetry stats
    const totalLogs = await prisma.accessLog.count();
    const totalUsers = await prisma.user.count();
    
    // Group active actions
    const loginsCount = await prisma.accessLog.count({ where: { action: 'LOGIN' } });
    const logoutsCount = await prisma.accessLog.count({ where: { action: 'LOGOUT' } });

    res.status(200).json({
      logs: formattedLogs,
      stats: {
        totalLogs,
        totalUsers,
        totalLogins: loginsCount,
        totalLogouts: logoutsCount,
      }
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Server error loading mainframe access log' });
  }
});

// Admin Users APIs
router.get('/users', requireAuth, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Requires Command Admin authorization level.' });
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: { urls: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      restricted: u.restricted,
      createdAt: u.createdAt,
      urlCount: u._count.urls,
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Server error loading registry officers list' });
  }
});

router.put('/users/:id/restrict', requireAuth, async (req, res) => {
  try {
    if (req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Requires Command Admin authorization level.' });
    }

    const { id } = req.params;
    const { restricted } = req.body;

    const userToUpdate = await prisma.user.findUnique({
      where: { id }
    });

    if (!userToUpdate) {
      return res.status(404).json({ error: 'Officer profile not found.' });
    }

    if (userToUpdate.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot restrict administrative credentials.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { restricted: !!restricted }
    });

    res.status(200).json({
      message: `Access authorization updated for ${updatedUser.email}`,
      restricted: updatedUser.restricted
    });
  } catch (error) {
    console.error('Error updating user restriction:', error);
    res.status(500).json({ error: 'Server error updating clearance status' });
  }
});

export default router;
