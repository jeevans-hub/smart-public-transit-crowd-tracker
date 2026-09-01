import dotenv from 'dotenv';
import { createTransitProvider } from '../services/transit/transitProviderFactory.ts';
import { LiveActivationService, getLiveActivationConfig } from '../services/transit/liveActivationService.ts';
import { calculateFreshnessMetrics, calculateMappingMetrics, verifyGenericBmtcFeed } from '../services/transit/liveFeedValidationService.ts';
import { validateTransitPosition } from '../utils/transitPositionValidator.ts';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const selection = createTransitProvider();
console.log('Phase 7E controlled live-feed verification');
console.log(`Provider: ${selection.requestedProvider}`);
console.log(`Configuration valid: ${selection.configurationValid ? 'yes' : 'no'}`);
if (selection.mode !== 'GTFS_RT' && selection.mode !== 'MOOVIT') {
  console.log(`Activation state: NOT_CONFIGURED`);
  console.log(`Reason: ${selection.reason}`);
  console.log('KEEPING DEMO MODE. No external request was made.');
  process.exit(0);
}

try {
  const startedAt = Date.now();
  const provider = selection.provider;
  const [routes, stops, vehicles, context] = await Promise.all([
    provider.getRoutes(), provider.getStops(), provider.getVehiclePositions(), provider.getStaticValidationContext?.(),
  ]);
  const staticContext = context ?? { tripIds: [], routeIds: routes.map((route) => route.routeId), stopIds: stops.map((stop) => stop.stopId) };
  const verification = provider.verifySnapshot?.({ routes, vehicles, tripUpdates: [] }) ?? verifyGenericBmtcFeed(routes, vehicles, []);
  const staleSeconds = selection.config?.staleAfterSeconds ?? 120;
  const freshness = calculateFreshnessMetrics(vehicles, staleSeconds);
  const mapping = calculateMappingMetrics(vehicles, [], staticContext);
  const validations = vehicles.map((vehicle) => validateTransitPosition(vehicle, { staleAfterSeconds: staleSeconds }));
  const positions = {
    validCount: validations.filter((item) => item.status === 'VALID').length,
    suspiciousCount: validations.filter((item) => item.status === 'SUSPICIOUS').length,
    invalidCount: validations.filter((item) => item.status === 'INVALID').length,
    rejectedCount: validations.filter((item) => item.status === 'INVALID').length,
  };
  const activation = new LiveActivationService(getLiveActivationConfig()).evaluate({ configured: true, authenticated: true, verification, mapping, freshness, positions, vehicleCount: freshness.freshCount, requestSucceeded: true });
  console.log(`Request latency: ${Date.now() - startedAt} ms`);
  console.log(`Identity verification: ${verification.status}`);
  console.log(`Vehicles: ${vehicles.length}; fresh: ${freshness.freshCount}; mapping: ${mapping.overallPercent}%`);
  console.log(`Activation state: ${activation.state}; decision: ${activation.decision}`);
  console.log(`Reasons: ${activation.reasons.join('; ')}`);
} catch (error) {
  const message = error instanceof Error ? error.message.replace(/https?:\/\/[^\s]+/gi, '[provider endpoint]').slice(0, 300) : 'Unknown provider failure';
  console.log('Activation state: FAILED');
  console.log(`Safe failure: ${message}`);
  console.log('KEEPING DEMO MODE.');
  process.exitCode = 1;
}
