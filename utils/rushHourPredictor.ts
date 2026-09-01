import type { RushHourPrediction, TransitCrowdAggregate } from '../types/recommendation.ts';

const clamp = (value: number) => Math.min(100, Math.max(0, value));

export function classifyRushScore(score: number): RushHourPrediction['rushLevel'] {
  if (score >= 85) return 'EXTREME';
  if (score >= 65) return 'HIGH';
  if (score >= 40) return 'MODERATE';
  return 'LOW';
}

function demoRushPrior(at: Date): { score: number; factors: string[] } {
  const hour = at.getHours();
  const weekday = at.getDay() >= 1 && at.getDay() <= 5;
  const factors: string[] = [];
  let score = weekday ? 30 : 20;

  if (weekday && hour >= 7 && hour < 10) {
    score = 76;
    factors.push('Weekday morning peak prior');
  } else if (weekday && hour >= 16 && hour < 20) {
    score = 82;
    factors.push('Weekday evening peak prior');
  } else if (hour >= 11 && hour < 16) {
    score += 14;
    factors.push('Midday demand prior');
  } else if (hour < 6 || hour >= 22) {
    score = 12;
    factors.push('Late-night off-peak prior');
  } else {
    factors.push(weekday ? 'Weekday off-peak prior' : 'Weekend demand prior');
  }

  return { score, factors };
}

export function predictRushHour(
  at: Date,
  historical?: TransitCrowdAggregate | null,
): RushHourPrediction {
  const prior = demoRushPrior(at);
  if (!historical || historical.sampleCount === 0) {
    return {
      rushLevel: classifyRushScore(prior.score),
      rushScore: prior.score,
      confidence: 55,
      source: 'DEMO_PRIOR',
      factors: prior.factors,
    };
  }

  const historyScore = clamp(historical.averageDemand * 0.65 + historical.averageCrowdScore * 0.35);
  const historyWeight = historical.sampleCount >= 12 ? 0.8 : 0.6;
  const rushScore = Math.round(historyScore * historyWeight + prior.score * (1 - historyWeight));
  const factors = [
    `Historical demand average ${historical.averageDemand}%`,
    `Historical crowd average ${historical.averageCrowdScore}%`,
  ];
  if (historical.averageDelay >= 5) factors.push('Recent delays increased expected demand');

  return {
    rushLevel: classifyRushScore(rushScore),
    rushScore,
    confidence: Math.round(clamp((historical.confidence + 55) / 2)),
    source: historical.sampleCount >= 12 ? 'HISTORICAL' : 'MIXED',
    factors: [...factors, ...prior.factors],
  };
}
