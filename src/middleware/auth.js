import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { store } from '../models/store.js';

export function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );
}

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please provide a valid Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Support special demo token if using demo mode without registration
    if (token === 'demo-guest-token') {
      const demoUser = await store.findUserByEmail('demo@documind.ai');
      if (demoUser) {
        req.user = { id: demoUser.id, email: demoUser.email, name: demoUser.name, isDemo: true };
        return next();
      }
    }

    jwt.verify(token, ENV.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          error: 'Your session has expired or the token is invalid. Please sign in again.'
        });
      }

      const user = await store.findUserById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User account not found. Please log in again.'
        });
      }

      req.user = { id: user.id, email: user.email, name: user.name };
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Authentication failed due to an internal server error.'
    });
  }
}
