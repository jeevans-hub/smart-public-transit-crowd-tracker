import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/lib/env';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, env.JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeUser(user: any) {
  const { passwordHash, ...sanitized } = user.toObject ? user.toObject() : user;
  return sanitized;
}
