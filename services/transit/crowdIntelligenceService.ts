import mongoose from 'mongoose';
import CrowdReport from '@/models/CrowdReport';
import type { CrowdEstimate } from '@/types/transit';
import type { CrowdIntelligence, RushHourPrediction, TransitCrowdAggregate, TransitCrowdObservation } from '@/types/recommendation';
import { aggregateTransitCrowdHistory, filterCrowdHistory } from '@/utils/transitCrowdAggregation';
import { calculateCrowdIntelligence } from '@/utils/transitCrowdIntelligence';

const CACHE_TTL_MS = 60_000;
const historyCache = new Map<string, { expiresAt: number; observations: TransitCrowdObservation[] }>();

async function loadObservations(routeId?: string, stopId?: string): Promise<TransitCrowdObservation[]> {
  const cacheKey = `${routeId || '*'}:${stopId || '*'}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.observations;

  if (mongoose.connection.readyState !== 1) return [];
  try {
    const query: { routeId?: string; stationId?: string } = {};
    if (routeId) query.routeId = routeId;
    if (stopId) query.stationId = stopId;
    const reports = await CrowdReport.find(query).sort({ createdAt: -1 }).limit(250);
    const observations = reports.map((report) => ({
      routeId: report.routeId,
      stopId: report.stationId,
      timestamp: report.createdAt,
      crowdScore: report.occupancyPercentage,
      demandScore: report.occupancyPercentage,
      delayMinutes: 0,
    }));
    historyCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, observations });
    return observations;
  } catch {
    return [];
  }
}

export async function getHistoricalCrowdAggregate(input: {
  routeId?: string;
  stopId?: string;
  hour?: number;
  weekday?: number;
}): Promise<TransitCrowdAggregate> {
  const observations = await loadObservations(input.routeId, input.stopId);
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
