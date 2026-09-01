import assert from 'node:assert/strict';
import { LiveActivationService } from '../services/transit/liveActivationService.ts';
import { calculateEtaValidationMetrics, groupEtaMetrics, isGeofenceArrival } from '../services/transit/etaValidationService.ts';
import { calculateFreshnessMetrics, calculateMappingMetrics } from '../services/transit/liveFeedValidationService.ts';
import { calculateCrowdValidation, calculateRecommendationValidation } from '../services/transit/qualityValidationService.ts';
import { ProviderReliabilityService } from '../services/transit/providerReliabilityService.ts';
import type { TransitVehicle } from '../types/transit.ts';
import { checkPartialTripCompatibility } from '../utils/routeCompatibility.ts';
import { validateTransitPosition } from '../utils/transitPositionValidator.ts';

const now = new Date('2026-09-01T10:00:00Z');
const vehicle = (overrides: Partial<TransitVehicle> = {}): TransitVehicle => ({
  vehicleId: 'bus-1', registrationNumber: null, routeId: 'route-1', tripId: 'trip-1', direction: 'OUTBOUND',
  latitude: 12.9716, longitude: 77.5946, bearing: 0, speed: 25, currentStopId: 'stop-1', nextStopId: 'stop-2',
  timestamp: new Date(now.getTime() - 20_000).toISOString(),
  occupancy: { crowdLevel: 'LOW', crowdScore: 20, crowdConfidence: 80, crowdSource: 'LIVE_OCCUPANCY', passengerCount: null },
  dataSource: 'EXTERNAL', isLive: true, ...overrides,
});
const tripUpdates = [{ tripId: 'trip-1', routeId: 'route-1', vehicleId: 'bus-1', timestamp: now.toISOString(), dataSource: 'EXTERNAL' as const, stopTimeUpdates: [{ stopId: 'stop-2', arrivalTime: now.toISOString(), departureTime: null, delaySeconds: 0, etaMinutes: 0, etaSource: 'LIVE_TRIP_UPDATE' as const }] }];
const context = { tripIds: ['trip-1'], routeIds: ['route-1'], stopIds: ['stop-1', 'stop-2'] };

assert.equal(calculateMappingMetrics([vehicle()], tripUpdates, context).grade, 'GOOD');
assert.equal(calculateMappingMetrics([vehicle({ tripId: 'missing' })], tripUpdates, context).overallPercent, 0);
assert.equal(calculateFreshnessMetrics([vehicle(), vehicle({ vehicleId: 'stale', timestamp: new Date(now.getTime() - 180_000).toISOString() })], 120, now).freshPercent, 50);
assert.equal(validateTransitPosition(vehicle(), { now }).status, 'VALID');
assert.deepEqual(validateTransitPosition(vehicle({ latitude: 0, longitude: 0 }), { now }).reasons, ['INVALID_COORDINATES']);
assert.equal(validateTransitPosition(vehicle({ timestamp: new Date(now.getTime() + 60_000).toISOString() }), { now }).reasons.includes('FUTURE_TIMESTAMP'), true);
assert.equal(validateTransitPosition(vehicle({ timestamp: new Date(now.getTime() - 180_000).toISOString() }), { now }).reasons.includes('STALE'), true);
assert.equal(validateTransitPosition(vehicle(), { now, previous: vehicle() }).reasons.includes('DUPLICATE'), true);
assert.equal(validateTransitPosition(vehicle({ longitude: 78.5946, timestamp: now.toISOString() }), { now, previous: vehicle({ timestamp: new Date(now.getTime() - 60_000).toISOString() }) }).status, 'INVALID');

const passInput = { configured: true, authenticated: true, verification: { status: 'VERIFIED' as const, reason: 'fixture identity verified', bengaluruPlausible: true, routeMatchCount: 1, freshVehicleCount: 1 }, mapping: calculateMappingMetrics([vehicle()], tripUpdates, context), freshness: calculateFreshnessMetrics([vehicle()], 120, now), positions: { validCount: 1, suspiciousCount: 0, invalidCount: 0, rejectedCount: 0 }, vehicleCount: 1, requestSucceeded: true, now };
const shadow = new LiveActivationService({ shadowMode: true, requiredSuccessfulCycles: 2, minimumMappingPercent: 80, minimumFreshPercent: 90, minimumVehicleCount: 1, maximumErrorRatePercent: 100 });
assert.equal(shadow.evaluate(passInput).decision, 'KEEP_SHADOW');
assert.equal(shadow.evaluate(passInput).decision, 'KEEP_SHADOW');
const live = new LiveActivationService({ shadowMode: false, requiredSuccessfulCycles: 2, minimumMappingPercent: 80, minimumFreshPercent: 90, minimumVehicleCount: 1, maximumErrorRatePercent: 100 });
assert.equal(live.evaluate(passInput).decision, 'KEEP_SHADOW');
assert.equal(live.evaluate(passInput).decision, 'ALLOW_LIVE');
assert.equal(live.evaluate({ ...passInput, freshness: calculateFreshnessMetrics([vehicle({ timestamp: new Date(now.getTime() - 500_000).toISOString() })], 120, now) }).decision, 'DEGRADE');

const etaSamples = [1, 2, 8].map((minutes, index) => ({ routeId: index === 2 ? 'route-2' : 'route-1', hourOfDay: 10, source: 'LIVE_TRIP_UPDATE', predictedArrival: now, actualArrival: new Date(now.getTime() + minutes * 60_000) }));
const eta = calculateEtaValidationMetrics(etaSamples);
assert.equal(eta.sampleCount, 3); assert.equal(eta.medianAbsoluteErrorMinutes, 2); assert.equal(eta.p90AbsoluteErrorMinutes, 8);
assert.equal(groupEtaMetrics(etaSamples).byRoute['route-1'].sampleCount, 2);
assert.equal(isGeofenceArrival(75), true); assert.equal(isGeofenceArrival(101, 100), false);
const crowd = calculateCrowdValidation([{ predicted: 'HIGH', observed: 'HIGH', confidence: 90 }, { predicted: 'LOW', observed: 'VERY_HIGH', confidence: 70 }], true);
assert.equal(crowd.exactAgreementPercent, 50); assert.equal(crowd.majorErrorPercent, 50);
assert.equal(calculateCrowdValidation([], false).available, false);
assert.equal(calculateRecommendationValidation([{ offered: true, accepted: true, alternativeWasCompatible: true, arrivalDeltaMinutes: 4, crowdImprovementLevels: 2 }]).acceptedCount, 1);
const reliability = new ProviderReliabilityService(); reliability.recordSuccess(100); reliability.recordFailure(new Error('HTTP 429 rate limit'));
assert.equal(reliability.getSnapshot().uptimePercent, 50); assert.equal(reliability.getSnapshot().rateLimitFailures, 1);

const route = { routeId: 'route-1', routeNumber: '1', shortName: '1', longName: 'A-B', origin: 'A', destination: 'D', stopIds: ['a', 'b', 'c', 'd'], source: 'GTFS_STATIC' as const };
assert.equal(checkPartialTripCompatibility(route, ['a', 'b', 'c'], 'a', 'd', 'OUTBOUND').compatible, false);
assert.equal(checkPartialTripCompatibility(route, ['a', 'b', 'c', 'd'], 'a', 'd', 'OUTBOUND').compatible, true);

console.log('Phase 7E feed validation, activation, quality, geofence, and partial-trip tests passed.');
