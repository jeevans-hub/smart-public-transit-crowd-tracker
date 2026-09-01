import type { NextRequest } from 'next/server';
import connectDB from '../lib/mongodb.ts';
import { findById } from '../services/userService.ts';
import { COOKIE_CONFIG } from './constants.ts';
import { verifyToken } from './helpers.ts';
import {
  isRoleAllowed,
  type AppRole,
} from './accessPolicy.ts';

export {
  isRoleAllowed,
  PROVIDER_DIAGNOSTIC_ROLES,
  TICKET_VALIDATION_ROLES,
  type AppRole,
} from './accessPolicy.ts';

export async function authorizeRequest(request: NextRequest, allowedRoles: readonly AppRole[]) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return { authenticated: false, authorized: false, role: undefined } as const;
  if (decoded.role) return { authenticated: true, authorized: isRoleAllowed(decoded.role, allowedRoles), role: decoded.role } as const;
  if (decoded.userId.startsWith('mock_')) return { authenticated: true, authorized: false, role: 'user' as const };
  try {
    await connectDB();
    const user = await findById(decoded.userId);
    const role = user?.role;
    return { authenticated: true, authorized: isRoleAllowed(role, allowedRoles), role } as const;
  } catch {
    return { authenticated: true, authorized: false, role: undefined } as const;
  }
}
