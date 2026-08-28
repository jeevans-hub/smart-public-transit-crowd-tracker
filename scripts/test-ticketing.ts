import assert from 'node:assert/strict';

process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/test';
process.env.JWT_SECRET ||= 'ticketing-test-secret';
process.env.NEXT_PUBLIC_APP_NAME ||= 'Transit Tracker';

const { createTicketQrPayload, verifyTicketQrPayload } = await import('../lib/ticketSecurity.ts');
const { canCancelTicket, canUseTicket, resolveTicketStatus } = await import('../utils/ticketLifecycle.ts');
const { calculateCrowdLevel, calculateOccupancyPercentage } = await import('../utils/crowdCalculator.ts');

const payload = { ticketNumber: 'TT-TEST-001', userId: 'user-1', routeId: 'route-1', validUntil: new Date(Date.now() + 60_000).toISOString() };
const qr = createTicketQrPayload(payload);

const verifiedPayload = verifyTicketQrPayload(qr);
assert.deepEqual(verifiedPayload && {
  ticketNumber: verifiedPayload.ticketNumber,
  userId: verifiedPayload.userId,
  routeId: verifiedPayload.routeId,
  validUntil: verifiedPayload.validUntil,
}, payload, 'signed QR payload should round-trip');
assert.equal(verifyTicketQrPayload(`${qr}tampered`), null, 'tampered QR payload must be rejected');
assert.equal(resolveTicketStatus('ACTIVE', new Date(Date.now() - 1)), 'EXPIRED');
assert.equal(resolveTicketStatus('USED', new Date(Date.now() - 1)), 'USED');
assert.equal(canCancelTicket('ACTIVE'), true);
assert.equal(canCancelTicket('USED'), false);
assert.equal(canUseTicket('ACTIVE', new Date(Date.now() + 60_000)), true);
assert.equal(canUseTicket('USED', new Date(Date.now() + 60_000)), false, 'duplicate scans must be rejected');
assert.equal(calculateOccupancyPercentage(50, 100), 50);
assert.equal(calculateCrowdLevel(0), 'EMPTY');
assert.equal(calculateCrowdLevel(25), 'LOW');
assert.equal(calculateCrowdLevel(50), 'MEDIUM');
assert.equal(calculateCrowdLevel(75), 'HIGH');
assert.equal(calculateCrowdLevel(100), 'FULL');

console.log('Ticketing and crowd calculation tests passed.');
