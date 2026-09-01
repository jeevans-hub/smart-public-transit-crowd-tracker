import assert from 'node:assert/strict';
import { normalizeTransitFeedHealth } from '../utils/providerStatus.ts';
import { getTransitDataSourceBadgeState } from '../utils/transitDataSourceBadge.ts';

const fixedNow = new Date('2026-09-01T12:00:00Z');

const undefinedStatus = normalizeTransitFeedHealth(undefined, fixedNow);
assert.equal(undefinedStatus.status, 'DEMO', 'undefined provider status must normalize to demo');
assert.equal(undefinedStatus.activation.state, 'NOT_CONFIGURED', 'undefined provider status must have safe activation');
assert.equal(getTransitDataSourceBadgeState().label, 'DEMO TRANSIT DATA', 'loading state must render a safe demo badge');

const missingActivation = normalizeTransitFeedHealth({ status: 'DEMO', provider: 'GTFS_RT' }, fixedNow);
assert.equal(missingActivation.activation.state, 'NOT_CONFIGURED', 'missing activation must be restored');
assert.equal(missingActivation.activation.decision, 'FALLBACK_DEMO');

const demo = normalizeTransitFeedHealth({
  status: 'DEMO', provider: 'DEMO', dataSource: 'DEMO', fallbackActive: true,
  activation: { state: 'NOT_CONFIGURED', decision: 'FALLBACK_DEMO', reasons: ['Not configured'] },
}, fixedNow);
assert.equal(getTransitDataSourceBadgeState({
  source: 'DEMO', status: demo.status, provider: demo.provider,
  verificationStatus: demo.verificationStatus, fallbackActive: demo.fallbackActive,
  activationState: demo.activation.state,
}).label, 'DEMO TRANSIT DATA');

const live = normalizeTransitFeedHealth({
  status: 'LIVE', provider: 'GTFS_RT', dataSource: 'LIVE', fallbackActive: false,
  realFeedVerified: true, verificationStatus: 'VERIFIED',
  activation: { state: 'LIVE_VERIFIED', decision: 'ALLOW_LIVE', reasons: ['Verified'] },
}, fixedNow);
assert.equal(getTransitDataSourceBadgeState({
  source: 'BMTC_REALTIME', status: live.status, provider: live.provider,
  verificationStatus: live.verificationStatus, fallbackActive: live.fallbackActive,
  activationState: live.activation.state,
}).label, 'LIVE BMTC DATA');

const incompleteApiObject = normalizeTransitFeedHealth({
  provider: 'MOOVIT',
  activation: { reasons: [] },
}, fixedNow);
assert.equal(incompleteApiObject.status, 'DEMO');
assert.equal(incompleteApiObject.activation.state, 'NOT_CONFIGURED');
assert.equal(getTransitDataSourceBadgeState({ provider: incompleteApiObject.provider }).label, 'DEMO TRANSIT DATA');

assert.equal(getTransitDataSourceBadgeState({
  source: 'BMTC_REALTIME', status: 'LIVE', verificationStatus: 'VERIFIED', fallbackActive: false,
}).label, 'DEMO TRANSIT DATA', 'missing activation must never be promoted to live');

console.log('Phase 7E.1 provider-status normalization and badge regression tests passed.');
