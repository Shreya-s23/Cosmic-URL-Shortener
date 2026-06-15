import jwt from 'jsonwebtoken';
import prisma from '../prisma/db.js';

export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-space-jwt-key-9988');
    
    // Fetch the user from database to ensure immediate sync of role/restriction updates
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Clearance profile not found' });
    }

    req.userId = user.id;
    req.userRole = user.role;
    req.userRestricted = user.restricted;

    // Block suspended standard users from calling any authenticated API (except logout)
    if (user.restricted && user.role !== 'ADMIN' && !req.originalUrl.includes('/logout')) {
      return res.status(403).json({
        error: 'CLEARANCE_SUSPENDED',
        message: 'Your clearance profile has been suspended by Command Administration due to security violations.'
      });
    }

    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return res.status(401).json({ error: 'Request is not authorized' });
  }
};
