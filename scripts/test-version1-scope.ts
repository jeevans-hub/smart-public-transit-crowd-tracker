import assert from 'node:assert/strict';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET ||= 'version1-scope-test-secret';
process.env.NEXT_PUBLIC_APP_NAME ||= 'Transit Tracker';

const {
  isRoleAllowed,
  PROVIDER_DIAGNOSTIC_ROLES,
  TICKET_VALIDATION_ROLES,
} = await import('../utils/accessPolicy.ts');
const { getNavigationForRole } = await import('../utils/navigation.ts');

assert.equal(isRoleAllowed('admin', TICKET_VALIDATION_ROLES), true);
assert.equal(isRoleAllowed('user', TICKET_VALIDATION_ROLES), false);
assert.equal(isRoleAllowed(undefined, TICKET_VALIDATION_ROLES), false);
assert.equal(isRoleAllowed('admin', PROVIDER_DIAGNOSTIC_ROLES), true);
assert.equal(isRoleAllowed('user', PROVIDER_DIAGNOSTIC_ROLES), false);

const passengerLinks = getNavigationForRole('user').map((item) => item.href);
const adminLinks = getNavigationForRole('admin').map((item) => item.href);

assert.deepEqual(passengerLinks, [
  '/dashboard',
  '/dashboard/bmtc',
  '/dashboard/bmtc/nearby',
  '/dashboard/bmtc/forecasts',
  '/dashboard/tickets',
  '/dashboard/tickets/history',
]);
assert.equal(passengerLinks.includes('/dashboard/tickets/validate'), false);
assert.equal(passengerLinks.includes('/dashboard/bmtc/diagnostics'), false);
assert.equal(adminLinks.includes('/dashboard/tickets/validate'), true);
assert.equal(adminLinks.includes('/dashboard/bmtc/diagnostics'), true);

console.log('Version 1.0 scope and role policy tests passed.');
