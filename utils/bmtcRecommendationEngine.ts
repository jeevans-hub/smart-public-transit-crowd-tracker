import type {
  BmtcRecommendation,
  BmtcRecommendationAlternative,
  RecommendationCandidate,
  RejectedRecommendationCandidate,
  RushHourPrediction,
} from '../types/recommendation.ts';
import type { TransitDataSource, TransitRoute } from '../types/transit.ts';
import { checkRouteCompatibility } from './routeCompatibility.ts';

const clamp = (value: number) => Math.min(100, Math.max(0, value));
const round = (value: number) => Math.round(value * 10) / 10;

export interface RecommendationEngineInput {
  selectedStopId: string;
  destinationStopId: string;
  destinationName?: string;
  routes: TransitRoute[];
  candidates: RecommendationCandidate[];
  rush: RushHourPrediction;
  maxWaitMinutes?: number;
  dataSource: TransitDataSource;
  generatedAt?: Date;
}

function scoreCandidate(
  candidate: RecommendationCandidate,
  maxWaitMinutes: number,
  rushScore: number,
): BmtcRecommendationAlternative {
  const etaScore = clamp(100 - (candidate.etaMinutes / maxWaitMinutes) * 100);
  const effectiveCrowd = clamp(candidate.crowdScore + rushScore * 0.1);
  const crowdScore = 100 - effectiveCrowd;
  const delayScore = clamp(100 - (Math.max(0, candidate.delayMinutes) / 15) * 100);
  const confidenceScore = clamp(candidate.crowdConfidence);
  const routeFitScore = 100;
  const recommendationScore = round(
    etaScore * 0.35
    + crowdScore * 0.35
    + delayScore * 0.15
    + confidenceScore * 0.10
    + routeFitScore * 0.05,
  );

  return {
    ...candidate,
    recommendationScore,
    scoreBreakdown: {
      eta: round(etaScore),
      crowd: round(crowdScore),
      delay: round(delayScore),
      confidence: round(confidenceScore),
      routeFit: routeFitScore,
    },
    isRecommended: false,
  };
}

function recommendationReason(
  recommended: BmtcRecommendationAlternative,
  first: BmtcRecommendationAlternative,
  compatibleCount: number,
  destinationName: string,
): string {
  if (compatibleCount === 1) {
    return `Route ${recommended.routeNumber} is the only destination-compatible bus within the selected wait time and serves ${destinationName}.`;
  }
  if (recommended.vehicleId === first.vehicleId) {
    return `Route ${recommended.routeNumber} is the best option because it arrives first, serves ${destinationName}, and has the strongest combined ETA, crowd, delay, and confidence score.`;
  }

  const waitDifference = recommended.etaMinutes - first.etaMinutes;
  const waitText = waitDifference > 0
    ? `arrives approximately ${waitDifference} minute${waitDifference === 1 ? '' : 's'} after the first ${first.routeNumber}`
    : 'arrives no later than the first compatible bus';
  const crowdText = recommended.crowdScore < first.crowdScore
    ? recommended.crowdLevel === first.crowdLevel
      ? `has a lower predicted crowd score within the ${recommended.crowdLevel.replace('_', ' ')} range`
      : `is expected to be less crowded (${recommended.crowdLevel} instead of ${first.crowdLevel})`
    : 'has a better overall ETA, delay, and confidence balance';
  return `Route ${recommended.routeNumber} is the better option. It ${waitText}, ${crowdText}, and serves ${destinationName}.`;
}

export function recommendBestBus(input: RecommendationEngineInput): BmtcRecommendation {
  const maxWaitMinutes = input.maxWaitMinutes ?? 30;
  const routesById = new Map(input.routes.map((route) => [route.routeId, route]));
  const rejectedCandidates: RejectedRecommendationCandidate[] = [];
  const compatibleCandidates = input.candidates.filter((candidate) => {
    const route = routesById.get(candidate.routeId);
    if (!route) {
      rejectedCandidates.push({ vehicleId: candidate.vehicleId, routeNumber: candidate.routeNumber, reason: 'Route details are unavailable' });
      return false;
    }
    if (candidate.etaMinutes > maxWaitMinutes) {
      rejectedCandidates.push({ vehicleId: candidate.vehicleId, routeNumber: candidate.routeNumber, reason: `Arrival exceeds the ${maxWaitMinutes}-minute wait limit` });
      return false;
    }
    const compatibility = checkRouteCompatibility(route, input.selectedStopId, input.destinationStopId, candidate.direction);
    if (!compatibility.compatible) {
      rejectedCandidates.push({ vehicleId: candidate.vehicleId, routeNumber: candidate.routeNumber, reason: compatibility.reason });
      return false;
    }
    return true;
  });

  const scored = compatibleCandidates
    .map((candidate) => scoreCandidate(candidate, maxWaitMinutes, input.rush.rushScore))
    .sort((a, b) => b.recommendationScore - a.recommendationScore
      || a.etaMinutes - b.etaMinutes
      || a.crowdScore - b.crowdScore
      || a.vehicleId.localeCompare(b.vehicleId));
  const firstArriving = [...scored].sort((a, b) => a.etaMinutes - b.etaMinutes || a.vehicleId.localeCompare(b.vehicleId))[0] ?? null;
  const recommended = scored[0] ? { ...scored[0], isRecommended: true } : null;
  const alternatives = scored.map((candidate) => ({
    ...candidate,
    isRecommended: candidate.vehicleId === recommended?.vehicleId,
  }));
  const destinationName = input.destinationName || input.destinationStopId;

  return {
    selectedStopId: input.selectedStopId,
    destinationStopId: input.destinationStopId,
    recommendedBus: recommended,
    firstArrivingBus: firstArriving,
    alternatives,
    rejectedCandidates,
    rush: input.rush,
    reason: recommended && firstArriving
      ? recommendationReason(recommended, firstArriving, compatibleCandidates.length, destinationName)
      : `No destination-compatible bus serves ${destinationName} within ${maxWaitMinutes} minutes.`,
    generatedAt: (input.generatedAt ?? new Date()).toISOString(),
    dataSource: input.dataSource,
  };
}
