import type {
  TransitFreshnessMetrics,
  TransitMappingMetrics,
  TransitStaticValidationContext,
  TransitProviderVerification,
  TransitRoute,
  TransitTripUpdate,
  TransitVehicle,
} from '../../types/transit';

const percent = (matched: number, total: number) => total === 0 ? 100 : Math.round(matched / total * 10_000) / 100;

export function calculateMappingMetrics(
  vehicles: TransitVehicle[],
  tripUpdates: TransitTripUpdate[],
  context: TransitStaticValidationContext,
  thresholds = { good: 95, minimum: 80 },
): TransitMappingMetrics {
  const staticTrips = new Set(context.tripIds);
  const staticRoutes = new Set(context.routeIds);
  const staticStops = new Set(context.stopIds);
  const updateTrips = new Set(tripUpdates.map((item) => item.tripId));
  const vehicleToTripPercent = percent(vehicles.filter((item) => staticTrips.has(item.tripId) || updateTrips.has(item.tripId)).length, vehicles.length);
  const allTrips = [...vehicles, ...tripUpdates];
  const tripToRoutePercent = percent(allTrips.filter((item) => staticRoutes.has(item.routeId)).length, allTrips.length);
  const tripUpdateToStaticTripPercent = percent(tripUpdates.filter((item) => staticTrips.has(item.tripId)).length, tripUpdates.length);
  const stopTimes = tripUpdates.flatMap((item) => item.stopTimeUpdates);
  const stopTimeToStaticStopPercent = percent(stopTimes.filter((item) => staticStops.has(item.stopId)).length, stopTimes.length);
  const values = [vehicleToTripPercent, tripToRoutePercent, tripUpdateToStaticTripPercent, stopTimeToStaticStopPercent];
  const overallPercent = Math.round(Math.min(...values) * 100) / 100;
  return {
    vehicleToTripPercent,
    tripToRoutePercent,
    tripUpdateToStaticTripPercent,
    stopTimeToStaticStopPercent,
    overallPercent,
    grade: overallPercent >= thresholds.good ? 'GOOD' : overallPercent >= thresholds.minimum ? 'DEGRADED' : 'FAIL',
  };
}

export function verifyGenericBmtcFeed(
  routes: TransitRoute[],
  vehicles: TransitVehicle[],
  tripUpdates: TransitTripUpdate[],
): TransitProviderVerification {
  const namedBmtcRoutes = routes.filter((route) => /\bBMTC\b|Bengaluru Metropolitan Transport/i.test(route.agencyName ?? ''));
  const bengaluruVehicles = vehicles.filter((vehicle) => vehicle.latitude >= 12.65 && vehicle.latitude <= 13.35
    && vehicle.longitude >= 77.30 && vehicle.longitude <= 77.90);
  const routeIds = new Set(routes.map((route) => route.routeId));
  const routeMatchCount = [...vehicles, ...tripUpdates].filter((item) => routeIds.has(item.routeId)).length;
  if (namedBmtcRoutes.length === 0) {
    return { status: 'UNVERIFIED', reason: 'Static agency metadata does not identify BMTC', bengaluruPlausible: bengaluruVehicles.length > 0, routeMatchCount, freshVehicleCount: vehicles.filter((vehicle) => vehicle.isLive).length };
  }
  if (vehicles.length > 0 && bengaluruVehicles.length / vehicles.length < 0.95) {
    return { status: 'FAILED', reason: 'Vehicle geography is inconsistent with Bengaluru', bengaluruPlausible: false, routeMatchCount, freshVehicleCount: vehicles.filter((vehicle) => vehicle.isLive).length };
  }
  if (routeMatchCount === 0) {
    return { status: 'FAILED', reason: 'Realtime trips do not map to the BMTC static routes', bengaluruPlausible: true, routeMatchCount, freshVehicleCount: vehicles.filter((vehicle) => vehicle.isLive).length };
  }
  return { status: 'VERIFIED', reason: 'BMTC agency identity, Bengaluru geography, and route mapping were verified', bengaluruPlausible: true, routeMatchCount, freshVehicleCount: vehicles.filter((vehicle) => vehicle.isLive).length };
}

export function calculateFreshnessMetrics(vehicles: TransitVehicle[], staleAfterSeconds: number, now = new Date()): TransitFreshnessMetrics {
  const ages = vehicles.map((item) => Math.max(0, (now.getTime() - Date.parse(item.timestamp)) / 1000)).filter(Number.isFinite).sort((a, b) => a - b);
  const freshCount = ages.filter((age) => age <= staleAfterSeconds).length;
  const midpoint = Math.floor(ages.length / 2);
  const median = ages.length === 0 ? null : ages.length % 2 ? ages[midpoint] : (ages[midpoint - 1] + ages[midpoint]) / 2;
  return {
    newestAgeSeconds: ages[0] === undefined ? null : Math.round(ages[0]),
    medianAgeSeconds: median === null ? null : Math.round(median),
    oldestAgeSeconds: ages.at(-1) === undefined ? null : Math.round(ages.at(-1) as number),
    freshCount,
    staleCount: Math.max(0, vehicles.length - freshCount),
    freshPercent: percent(freshCount, vehicles.length),
  };
}
