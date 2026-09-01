import type { CrowdEstimate } from '@/types/transit';
import type { CrowdIntelligence, RushHourPrediction, TransitCrowdAggregate, TransitCrowdObservation } from '@/types/recommendation';
import { aggregateTransitCrowdHistory, filterCrowdHistory } from '@/utils/transitCrowdAggregation';
import { calculateCrowdIntelligence } from '@/utils/transitCrowdIntelligence';

async function loadObservations(): Promise<TransitCrowdObservation[]> {
  // Version 1.0 does not collect passenger-submitted crowd reports. The
  // provider occupancy and deterministic rush model remain the active inputs.
  return [];
}

export async function getHistoricalCrowdAggregate(input: {
  routeId?: string;
  stopId?: string;
  hour?: number;
  weekday?: number;
}): Promise<TransitCrowdAggregate> {
  const observations = await loadObservations();
  return aggregateTransitCrowdHistory(filterCrowdHistory(observations, input));
}

export async function getCrowdIntelligence(input: {
  routeId: string;
  stopId?: string;
  occupancy?: CrowdEstimate | null;
  rush: RushHourPrediction;
  at: Date;
  recentDelayMinutes?: number;
}): Promise<CrowdIntelligence> {
  const historical = await getHistoricalCrowdAggregate({
    routeId: input.routeId,
    stopId: input.stopId,
    hour: input.at.getHours(),
    weekday: input.at.getDay(),
  });
  return calculateCrowdIntelligence({
    occupancy: input.occupancy,
    historical,
    rush: input.rush,
    recentDelayMinutes: input.recentDelayMinutes,
  });
}
