export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Smart Public Transit Crowd Tracker';

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User with this email or username already exists',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_TOKEN: 'Invalid or expired token',
} as const;

export const VALIDATION_ERRORS = {
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_MIN_LENGTH: 'Username must be at least 3 characters',
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 6 characters',
} as const;

export const COOKIE_CONFIG = {
  name: 'auth-token',
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
} as const;

export const CROWD_LEVELS = {
  EMPTY: 'EMPTY',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  FULL: 'FULL',
} as const;

export const REPORT_SOURCES = {
  USER: 'USER',
  STAFF: 'STAFF',
  SYSTEM: 'SYSTEM',
} as const;

export const CROWD_LEVEL_COLORS = {
  EMPTY: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    badge: 'bg-gray-200 text-gray-800',
  },
  LOW: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-300',
    badge: 'bg-green-200 text-green-800',
  },
  MEDIUM: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    border: 'border-yellow-300',
    badge: 'bg-yellow-200 text-yellow-800',
  },
  HIGH: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-300',
    badge: 'bg-orange-200 text-orange-800',
  },
  FULL: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-300',
    badge: 'bg-red-200 text-red-800',
  },
} as const;

export const CROWD_THRESHOLDS = {
  EMPTY: 0,
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  FULL: 100,
} as const;

export const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
