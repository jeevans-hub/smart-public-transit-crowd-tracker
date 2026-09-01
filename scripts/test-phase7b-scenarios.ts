import assert from 'node:assert/strict';
import { recommendBestBus } from '../utils/bmtcRecommendationEngine.ts';
import { aggregateTransitCrowdHistory } from '../utils/transitCrowdAggregation.ts';
import { predictRushHour } from '../utils/rushHourPredictor.ts';
import { calculateCrowdIntelligence, classifyTransitCrowdScore } from '../utils/transitCrowdIntelligence.ts';
import { evaluateBmtcAlert } from '../utils/bmtcAlertEvaluator.ts';
import { findBestTravelWindow } from '../utils/bestTravelTime.ts';

const demoRush = {
  rushLevel: 'MODERATE' as const,
  rushScore: 45,
  confidence: 55,
  source: 'DEMO_PRIOR' as const,
  factors: ['Manual scenario baseline'],
};

const route242 = {
  routeId: 'route-242',
  routeNumber: '242',
  shortName: '242',
  longName: 'Origin – Destination',
  origin: 'Origin',
  destination: 'Destination',
  stopIds: ['origin', 'middle', 'destination'],
  source: 'DEMO' as const,
};

const route242A = {
  ...route242,
  routeId: 'route-242a',
  routeNumber: '242A',
  shortName: '242A',
  stopIds: ['origin', 'alternative-middle', 'destination'],
};

const incompatibleRoute = {
  ...route242,
  routeId: 'route-other',
  routeNumber: '999',
  shortName: '999',
  destination: 'Other Destination',
  stopIds: ['origin', 'other-destination'],
};

function candidate(overrides: Record<string, unknown>) {
  return {
    vehicleId: 'bus-a',
    routeId: 'route-242',
    routeNumber: '242',
    direction: 'OUTBOUND' as const,
    currentStopId: null,
    nextStopId: null,
    etaMinutes: 4,
    delayMinutes: 0,
    crowdLevel: 'VERY_HIGH' as const,
    crowdScore: 92,
    crowdConfidence: 87,
    crowdSource: 'DEMO' as const,
    passengerCount: null,
    dataSource: 'DEMO' as const,
    ...overrides,
  };
}

function runScenario(name: string, input: Parameters<typeof recommendBestBus>[0], expectedVehicleId: string) {
  const result = recommendBestBus(input);
  assert.equal(result.recommendedBus?.vehicleId, expectedVehicleId, name);
  console.log(`PASS ${name}: ${result.recommendedBus?.routeNumber} (${result.recommendedBus?.vehicleId})`);
  console.log(`     ${result.reason}`);
  return result;
}

runScenario(
  'crowded first bus -> less crowded later bus',
  {
    selectedStopId: 'origin',
    destinationStopId: 'destination',
    destinationName: 'Destination',
    routes: [route242],
    candidates: [
      candidate({ vehicleId: 'crowded-first', etaMinutes: 4, crowdLevel: 'VERY_HIGH', crowdScore: 94, crowdConfidence: 87 }),
      candidate({ vehicleId: 'less-crowded-later', etaMinutes: 9, crowdLevel: 'LOW', crowdScore: 18, crowdConfidence: 79 }),
    ],
    rush: demoRush,
    dataSource: 'DEMO',
  },
  'less-crowded-later',
);

const wrongDirection = runScenario(
  'wrong-direction bus is rejected',
  {
    selectedStopId: 'origin',
    destinationStopId: 'destination',
    routes: [route242],
    candidates: [
      candidate({ vehicleId: 'correct-direction', etaMinutes: 6, crowdLevel: 'HIGH', crowdScore: 76 }),
      candidate({ vehicleId: 'wrong-direction', direction: 'INBOUND', etaMinutes: 2, crowdLevel: 'LOW', crowdScore: 8 }),
    ],
    rush: demoRush,
    dataSource: 'DEMO',
  },
  'correct-direction',
);
assert.equal(wrongDirection.rejectedCandidates.some((item) => item.vehicleId === 'wrong-direction' && item.reason.includes('wrong direction')), true);

const noAlternative = runScenario(
  'no alternative keeps the only compatible bus',
  {
    selectedStopId: 'origin',
    destinationStopId: 'destination',
    routes: [route242, incompatibleRoute],
    candidates: [
      candidate({ vehicleId: 'only-compatible', etaMinutes: 5, crowdLevel: 'HIGH', crowdScore: 78 }),
      candidate({ vehicleId: 'incompatible', routeId: 'route-other', routeNumber: '999', etaMinutes: 6, crowdLevel: 'LOW', crowdScore: 10 }),
    ],
    rush: demoRush,
    dataSource: 'DEMO',
  },
  'only-compatible',
);
assert.equal(noAlternative.alternatives.length, 1);
assert.match(noAlternative.reason, /only destination-compatible bus/i);

const compatibleAlternative = runScenario(
  'destination-compatible alternative is selected',
  {
    selectedStopId: 'origin',
    destinationStopId: 'destination',
    destinationName: 'Destination',
    routes: [route242, route242A, incompatibleRoute],
    candidates: [
      candidate({ vehicleId: 'first-242', etaMinutes: 4, crowdLevel: 'VERY_HIGH', crowdScore: 95 }),
      candidate({ vehicleId: 'compatible-242a', routeId: 'route-242a', routeNumber: '242A', etaMinutes: 9, crowdLevel: 'LOW', crowdScore: 14 }),
      candidate({ vehicleId: 'incompatible-999', routeId: 'route-other', routeNumber: '999', etaMinutes: 5, crowdLevel: 'LOW', crowdScore: 5 }),
    ],
    rush: demoRush,
    dataSource: 'DEMO',
  },
  'compatible-242a',
);
assert.equal(compatibleAlternative.rejectedCandidates.some((item) => item.vehicleId === 'incompatible-999'), true);

assert.equal(classifyTransitCrowdScore(34), 'LOW');
assert.equal(classifyTransitCrowdScore(35), 'MEDIUM');
assert.equal(classifyTransitCrowdScore(65), 'HIGH');
assert.equal(classifyTransitCrowdScore(85), 'VERY_HIGH');

const history = aggregateTransitCrowdHistory([
  { routeId: 'route-242', stopId: 'origin', timestamp: new Date('2026-08-31T08:00:00+05:30'), crowdScore: 60, delayMinutes: 2, demandScore: 65 },
  { routeId: 'route-242', stopId: 'origin', timestamp: new Date('2026-08-24T08:00:00+05:30'), crowdScore: 80, delayMinutes: 6, demandScore: 85 },
]);
assert.equal(history.averageCrowdScore, 70);
assert.equal(history.peakCrowdScore, 80);
assert.equal(history.sampleCount, 2);
assert.equal(history.averageDelay, 4);

const rushA = predictRushHour(new Date('2026-08-31T08:00:00+05:30'), history);
const rushB = predictRushHour(new Date('2026-08-31T08:00:00+05:30'), history);
assert.deepEqual(rushA, rushB, 'rush prediction must be deterministic');

const intelligenceInput = {
  occupancy: { crowdLevel: 'HIGH' as const, crowdScore: 75, crowdConfidence: 80, crowdSource: 'DEMO' as const, passengerCount: null },
  historical: history,
  rush: rushA,
  recentDelayMinutes: 6,
};
assert.deepEqual(calculateCrowdIntelligence(intelligenceInput), calculateCrowdIntelligence(intelligenceInput), 'crowd intelligence must be deterministic');
assert.equal(calculateCrowdIntelligence(intelligenceInput).passengerCount, null, 'unknown passenger count must remain null');

runScenario(
  'same ETA prefers lower crowd',
  {
    selectedStopId: 'origin', destinationStopId: 'destination', routes: [route242], rush: demoRush, dataSource: 'DEMO',
    candidates: [candidate({ vehicleId: 'same-eta-high', etaMinutes: 7, crowdLevel: 'HIGH', crowdScore: 78 }), candidate({ vehicleId: 'same-eta-low', etaMinutes: 7, crowdLevel: 'LOW', crowdScore: 18 })],
  },
  'same-eta-low',
);

const alertCondition = { routeNumber: '242', stopId: 'origin', destinationStopId: 'destination', threshold: 'HIGH' as const, arrivalWithinMinutes: 10, onlyIfBetterAlternative: true, enabled: true };
const alertEvaluation = evaluateBmtcAlert(alertCondition, compatibleAlternative, new Date('2026-08-31T10:00:00Z'));
assert.equal(alertEvaluation.shouldTrigger, true, 'matching crowded route with a better compatible alternative should alert');
const cooldownEvaluation = evaluateBmtcAlert({ ...alertCondition, lastTriggeredAt: new Date('2026-08-31T09:55:00Z'), lastFingerprint: alertEvaluation.fingerprint }, compatibleAlternative, new Date('2026-08-31T10:00:00Z'));
assert.equal(cooldownEvaluation.shouldTrigger, false, 'duplicate alert must respect cooldown');
assert.match(cooldownEvaluation.reason, /cooldown/i);

const bestWindow = findBestTravelWindow([
  { hour: 6, label: '6 AM', crowdScore: 22, crowdLevel: 'LOW', confidence: 70, crowdSource: 'DEMO' },
  { hour: 8, label: '8 AM', crowdScore: 82, crowdLevel: 'HIGH', confidence: 75, crowdSource: 'DEMO' },
  { hour: 20, label: '8 PM', crowdScore: 34, crowdLevel: 'LOW', confidence: 72, crowdSource: 'DEMO' },
]);
assert.equal(bestWindow?.suggestedStart, '06:00');
assert.equal(bestWindow?.suggestedEnd, '08:00');

console.log('Phase 7B manual recommendation scenarios passed.');
