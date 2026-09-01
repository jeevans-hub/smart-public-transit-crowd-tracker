import type { BmtcCrowdPrediction, BmtcRecommendation, CrowdTrendPoint, RecommendationCandidate } from '@/types/recommendation';
import { recommendBestBus } from '@/utils/bmtcRecommendationEngine';
import { predictRushHour } from '@/utils/rushHourPredictor';
import { arrivalsForStop, getBmtcData } from './bmtcService';
import { getCrowdIntelligence, getHistoricalCrowdAggregate } from './crowdIntelligenceService';

export async function getBmtcRecommendation(input: {
  stopId: string;
  destinationStopId: string;
  routeNumber?: string;
  maxWaitMinutes?: number;
  at?: Date;
}): Promise<BmtcRecommendation | null> {
  const data = await getBmtcData();
  const stop = data.stops.find((item) => item.stopId === input.stopId);
  const destination = data.stops.find((item) => item.stopId === input.destinationStopId);
  if (!stop || !destination) return null;

  const at = input.at ?? new Date();
  const history = await getHistoricalCrowdAggregate({ stopId: input.stopId, hour: at.getHours(), weekday: at.getDay() });
  const rush = predictRushHour(at, history.sampleCount > 0 ? history : null);
  const arrivals = arrivalsForStop(stop, data.routes, data.vehicles, data.tripUpdates)
    .filter((arrival) => !input.routeNumber || arrival.routeNumber.toLowerCase() === input.routeNumber.toLowerCase());
  const vehiclesById = new Map(data.vehicles.map((vehicle) => [vehicle.vehicleId, vehicle]));

  const candidates: RecommendationCandidate[] = await Promise.all(arrivals.map(async (arrival) => {
    const vehicle = vehiclesById.get(arrival.vehicleId);
    const crowd = await getCrowdIntelligence({
      routeId: arrival.routeId,
      stopId: input.stopId,
      occupancy: arrival.crowd,
      rush,
      at,
      recentDelayMinutes: arrival.delayMinutes,
    });
    return {
      vehicleId: arrival.vehicleId,
      routeId: arrival.routeId,
      routeNumber: arrival.routeNumber,
      direction: arrival.direction,
      currentStopId: vehicle?.currentStopId,
      nextStopId: vehicle?.nextStopId,
      etaMinutes: arrival.etaMinutes,
      delayMinutes: arrival.delayMinutes,
      crowdLevel: crowd.crowdLevel,
      crowdScore: crowd.crowdScore,
      crowdConfidence: crowd.crowdConfidence,
      crowdSource: crowd.crowdSource,
      passengerCount: crowd.passengerCount,
      dataSource: arrival.dataSource,
    };
  }));

  return recommendBestBus({
    selectedStopId: input.stopId,
    destinationStopId: input.destinationStopId,
    destinationName: destination.name,
    routes: data.routes,
    candidates,
    rush,
    maxWaitMinutes: input.maxWaitMinutes,
    dataSource: data.dataSource,
    generatedAt: at,
  });
}

export async function getBmtcCrowdPredictions(input: {
  routeNumber?: string;
  stopId?: string;
  hour?: number;
  weekday?: number;
}): Promise<BmtcCrowdPrediction[]> {
  const data = await getBmtcData();
  const at = new Date();
  if (input.hour !== undefined) at.setHours(input.hour, 0, 0, 0);
  if (input.weekday !== undefined) at.setDate(at.getDate() + ((input.weekday - at.getDay() + 7) % 7));

  const routes = data.routes.filter((route) => {
    return (!input.routeNumber || route.routeNumber.toLowerCase().includes(input.routeNumber.toLowerCase()))
      && (!input.stopId || route.stopIds.includes(input.stopId));
  });

  return Promise.all(routes.map(async (route) => {
    const history = await getHistoricalCrowdAggregate({ routeId: route.routeId, stopId: input.stopId, hour: at.getHours(), weekday: at.getDay() });
    const rush = predictRushHour(at, history.sampleCount > 0 ? history : null);
    const vehicle = data.vehicles.find((item) => item.routeId === route.routeId);
    const crowd = await getCrowdIntelligence({ routeId: route.routeId, stopId: input.stopId, occupancy: vehicle?.occupancy, rush, at });
    return { routeId: route.routeId, routeNumber: route.routeNumber, ...(input.stopId ? { stopId: input.stopId } : {}), crowd, rush, generatedAt: at.toISOString(), dataSource: data.dataSource };
  }));
}

export async function getBmtcRouteCrowdPattern(routeNumber: string, stopId?: string): Promise<CrowdTrendPoint[] | null> {
  const data = await getBmtcData();
  const route = data.routes.find((item) => item.routeNumber.toLowerCase() === routeNumber.toLowerCase());
  if (!route || (stopId && !route.stopIds.includes(stopId))) return null;
  const vehicle = data.vehicles.find((item) => item.routeId === route.routeId);
  const hours = [6, 8, 10, 12, 14, 16, 18, 20];
  return Promise.all(hours.map(async (hour) => {
    const at = new Date();
    at.setHours(hour, 0, 0, 0);
    const historical = await getHistoricalCrowdAggregate({ routeId: route.routeId, stopId, hour, weekday: at.getDay() });
    const rush = predictRushHour(at, historical.sampleCount > 0 ? historical : null);
    const crowd = await getCrowdIntelligence({ routeId: route.routeId, stopId, occupancy: vehicle?.occupancy, rush, at });
    return { hour, label: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`, crowdScore: crowd.crowdScore, crowdLevel: crowd.crowdLevel, confidence: crowd.crowdConfidence, crowdSource: crowd.crowdSource };
  }));
}
