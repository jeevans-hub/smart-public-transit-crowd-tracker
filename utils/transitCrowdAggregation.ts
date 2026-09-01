import type { TransitCrowdAggregate, TransitCrowdObservation } from '../types/recommendation.ts';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const average = (values: number[]) => values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export function aggregateTransitCrowdHistory(
  observations: TransitCrowdObservation[],
): TransitCrowdAggregate {
  if (observations.length === 0) {
    return {
      averageCrowdScore: 0,
      peakCrowdScore: 0,
      sampleCount: 0,
      confidence: 0,
      averageDelay: 0,
      averageDemand: 0,
    };
  }

  const crowdScores = observations.map((item) => clamp(item.crowdScore));
  const delayValues = observations.map((item) => Math.max(0, item.delayMinutes ?? 0));
  const demandValues = observations.map((item) => clamp(item.demandScore ?? item.crowdScore));

  return {
    averageCrowdScore: Math.round(average(crowdScores)),
    peakCrowdScore: Math.round(Math.max(...crowdScores)),
    sampleCount: observations.length,
    confidence: Math.round(clamp(30 + observations.length * 6, 0, 95)),
    averageDelay: Math.round(average(delayValues) * 10) / 10,
    averageDemand: Math.round(average(demandValues)),
  };
}

export function filterCrowdHistory(
  observations: TransitCrowdObservation[],
  filters: { routeId?: string; stopId?: string; hour?: number; weekday?: number },
): TransitCrowdObservation[] {
  return observations.filter((observation) => {
    return (!filters.routeId || observation.routeId === filters.routeId)
      && (!filters.stopId || observation.stopId === filters.stopId)
      && (filters.hour === undefined || observation.timestamp.getHours() === filters.hour)
      && (filters.weekday === undefined || observation.timestamp.getDay() === filters.weekday);
  });
}
