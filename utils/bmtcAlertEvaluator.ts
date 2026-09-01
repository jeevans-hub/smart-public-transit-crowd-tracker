import type { BmtcRecommendation } from '../types/recommendation.ts';
import type { TransitCrowdLevel } from '../types/transit.ts';

const crowdRank: Record<TransitCrowdLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4 };

export interface BmtcAlertCondition {
  routeNumber: string;
  stopId: string;
  destinationStopId?: string;
  threshold: 'HIGH' | 'VERY_HIGH';
  arrivalWithinMinutes?: number;
  onlyIfBetterAlternative: boolean;
  enabled: boolean;
  lastTriggeredAt?: Date | string;
  lastFingerprint?: string;
}

export interface BmtcAlertEvaluation {
  shouldTrigger: boolean;
  reason: string;
  fingerprint?: string;
  message?: string;
}

export function evaluateBmtcAlert(
  condition: BmtcAlertCondition,
  recommendation: BmtcRecommendation,
  now = new Date(),
  cooldownMs = 10 * 60 * 1000,
): BmtcAlertEvaluation {
  if (!condition.enabled) return { shouldTrigger: false, reason: 'Alert is disabled' };
  if (condition.stopId !== recommendation.selectedStopId) return { shouldTrigger: false, reason: 'Boarding stop does not match' };
  if (condition.destinationStopId && condition.destinationStopId !== recommendation.destinationStopId) return { shouldTrigger: false, reason: 'Destination does not match' };

  const matchingBus = [...recommendation.alternatives]
    .filter((bus) => bus.routeNumber.toLowerCase() === condition.routeNumber.toLowerCase())
    .sort((a, b) => a.etaMinutes - b.etaMinutes)[0];
  if (!matchingBus) return { shouldTrigger: false, reason: 'No matching compatible bus is approaching' };
  if (crowdRank[matchingBus.crowdLevel] < crowdRank[condition.threshold]) return { shouldTrigger: false, reason: 'Crowd level is below the alert threshold' };
  if (condition.arrivalWithinMinutes !== undefined && matchingBus.etaMinutes > condition.arrivalWithinMinutes) return { shouldTrigger: false, reason: 'Bus is outside the arrival window' };

  const betterAlternative = recommendation.recommendedBus
    && recommendation.recommendedBus.vehicleId !== matchingBus.vehicleId
    && recommendation.recommendedBus.crowdScore < matchingBus.crowdScore;
  if (condition.onlyIfBetterAlternative && !betterAlternative) return { shouldTrigger: false, reason: 'No better destination-compatible alternative is available' };

  const fingerprint = `${condition.routeNumber}:${matchingBus.vehicleId}:${matchingBus.crowdLevel}:${recommendation.recommendedBus?.vehicleId || 'none'}`;
  const lastTriggeredAt = condition.lastTriggeredAt ? new Date(condition.lastTriggeredAt).getTime() : 0;
  if (condition.lastFingerprint === fingerprint && now.getTime() - lastTriggeredAt < cooldownMs) {
    return { shouldTrigger: false, reason: 'Matching alert is within its cooldown', fingerprint };
  }

  const alternativeText = betterAlternative && recommendation.recommendedBus
    ? ` Consider route ${recommendation.recommendedBus.routeNumber} in ${recommendation.recommendedBus.etaMinutes} minutes.`
    : '';
  return {
    shouldTrigger: true,
    reason: 'Alert conditions matched',
    fingerprint,
    message: `Route ${matchingBus.routeNumber} arriving in ${matchingBus.etaMinutes} minutes is ${matchingBus.crowdLevel.replace('_', ' ').toLowerCase()}.${alternativeText}`,
  };
}
