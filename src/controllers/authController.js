import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { store } from '../models/store.js';
import { signToken } from '../middleware/auth.js';

const RegisterSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(2, 'Name must be at least 2 characters long')
});

const LoginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const authController = {
  async register(req, res, next) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors[0].message
        });
      }

      const { email, password, name } = parsed.data;
      const existing = await store.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists. Please log in instead.'
        });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await store.createUser({ email, password_hash, name });
      const token = signToken(user);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          error: parsed.error.errors[0].message
        });
      }

      const { email, password } = parsed.data;
      const user = await store.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password. Please check your credentials.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password. Please check your credentials.'
        });
      }

      const token = signToken(user);
      return res.status(200).json({
        success: true,
        message: 'Signed in successfully.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async demoLogin(req, res, next) {
    try {
      let demoUser = await store.findUserByEmail('demo@documind.ai');
      if (!demoUser) {
        const hash = await bcrypt.hash('demo123456', 10);
        demoUser = await store.createUser({
          email: 'demo@documind.ai',
          password_hash: hash,
          name: 'Demo Reviewer'
        });
      }

      const token = signToken(demoUser);
      return res.status(200).json({
        success: true,
        message: 'Connected via 1-Click Demo Mode.',
        data: {
          token,
          user: {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            isDemo: true
          }
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async getProfile(req, res, next) {
    try {
      const user = await store.findUserById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found.'
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (err) {
      next(err);
    }
  }
};
