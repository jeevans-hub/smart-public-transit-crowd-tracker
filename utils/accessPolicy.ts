export type AppRole = 'user' | 'admin';

export const TICKET_VALIDATION_ROLES: readonly AppRole[] = ['admin'];
export const PROVIDER_DIAGNOSTIC_ROLES: readonly AppRole[] = ['admin'];

export function isRoleAllowed(role: AppRole | undefined, allowedRoles: readonly AppRole[]): boolean {
  return role !== undefined && allowedRoles.includes(role);
}
