import type { CrowdIntelligence, RushHourPrediction, TransitCrowdAggregate } from '../types/recommendation.ts';
import type { CrowdEstimate, TransitCrowdLevel } from '../types/transit.ts';

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function classifyTransitCrowdScore(score: number): TransitCrowdLevel {
  if (score >= 85) return 'VERY_HIGH';
  if (score >= 65) return 'HIGH';
  if (score >= 35) return 'MEDIUM';
  return 'LOW';
}

export function calculateCrowdIntelligence(input: {
  occupancy?: CrowdEstimate | null;
  historical?: TransitCrowdAggregate | null;
  rush: RushHourPrediction;
  recentDelayMinutes?: number;
}): CrowdIntelligence {
  const { occupancy, historical, rush } = input;
  const hasHistory = Boolean(historical && historical.sampleCount > 0);
  const factors: string[] = [];
  let crowdScore: number;
  let confidence: number;

  if (occupancy && hasHistory && historical) {
    crowdScore = occupancy.crowdScore * 0.65 + historical.averageCrowdScore * 0.25 + rush.rushScore * 0.10;
    confidence = occupancy.crowdConfidence * 0.65 + historical.confidence * 0.35;
    factors.push(`Current ${occupancy.crowdSource.toLowerCase().replaceAll('_', ' ')} estimate`);
    factors.push(`Historical route-hour crowd average ${historical.averageCrowdScore}%`);
  } else if (occupancy) {
    crowdScore = occupancy.crowdScore * 0.9 + rush.rushScore * 0.1;
    confidence = occupancy.crowdConfidence;
    factors.push(`Current ${occupancy.crowdSource.toLowerCase().replaceAll('_', ' ')} estimate`);
  } else if (hasHistory && historical) {
    crowdScore = historical.averageCrowdScore * 0.8 + rush.rushScore * 0.2;
    confidence = historical.confidence;
    factors.push(`Historical route-hour crowd average ${historical.averageCrowdScore}%`);
  } else {
    crowdScore = rush.rushScore * 0.75;
    confidence = 45;
    factors.push('Insufficient occupancy history; using demand prior');
  }

  if (rush.rushLevel === 'HIGH' || rush.rushLevel === 'EXTREME') {
    factors.push(`${rush.rushLevel === 'EXTREME' ? 'Extreme' : 'High'} rush-hour demand`);
  }
  if ((input.recentDelayMinutes ?? 0) >= 5) {
    crowdScore += Math.min(8, (input.recentDelayMinutes ?? 0) * 0.8);
    factors.push('Recent delay increased expected waiting demand');
  }

  const roundedScore = Math.round(clamp(crowdScore));
  const crowdSource = occupancy?.crowdSource === 'DEMO' && !hasHistory
    ? 'DEMO' as const
    : occupancy && hasHistory
      ? 'MIXED' as const
      : occupancy?.crowdSource ?? (hasHistory ? 'HISTORICAL_PREDICTION' as const : 'DEMO' as const);

  return {
    crowdLevel: classifyTransitCrowdScore(roundedScore),
    crowdScore: roundedScore,
    crowdConfidence: Math.round(clamp(confidence)),
    crowdSource,
    passengerCount: occupancy?.passengerCount ?? null,
    factors: [...new Set(factors)],
  };
}
