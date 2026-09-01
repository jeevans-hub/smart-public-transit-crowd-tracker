import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string, username?: string, role: 'user' | 'admin' = 'user'): string {
  return jwt.sign({ userId, username, role }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): { userId: string; username?: string; role?: 'user' | 'admin' } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId?: unknown; username?: unknown; role?: unknown };

    if (typeof payload.userId !== 'string' || payload.userId.length === 0) {
      return null;
    }

    return {
      userId: payload.userId,
      ...(typeof payload.username === 'string' ? { username: payload.username } : {}),
      ...(payload.role === 'user' || payload.role === 'admin' ? { role: payload.role } : {}),
    };
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeUser(user: unknown): Record<string, unknown> {
  const source = typeof user === 'object' && user !== null ? user as Record<string, unknown> : {};
  const raw = typeof source.toObject === 'function'
    ? (source.toObject as () => Record<string, unknown>)()
    : source;
  const sanitized = { ...raw };
  delete sanitized.passwordHash;
  return sanitized;
}
