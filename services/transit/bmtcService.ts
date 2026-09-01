import { haversineDistanceMeters } from '@/utils/geoDistance';
import type { TransitRoute, TransitStop, TransitTripUpdate, TransitVehicle, VehicleArrival } from '@/types/transit';
import { isVehicleApproachingStop } from '@/utils/routeCompatibility';
import { bmtcIngestionService } from './bmtcIngestionService';

export async function getBmtcData(options: { includeStale?: boolean } = {}) {
  return bmtcIngestionService.getData(options);
}

export function nearbyStops(stops: TransitStop[], latitude: number, longitude: number, radius: number) {
  return stops.map(stop => ({ ...stop, distanceMeters: Math.round(haversineDistanceMeters(latitude, longitude, stop.latitude, stop.longitude)) }))
    .filter(stop => stop.distanceMeters <= radius).sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function arrivalsForStop(
  stop: TransitStop,
  routes: TransitRoute[],
  vehicles: TransitVehicle[],
  tripUpdates: TransitTripUpdate[] = [],
): VehicleArrival[] {
  return vehicles.filter(vehicle => {
    const route = routes.find(item => item.routeId === vehicle.routeId);
    return route?.stopIds.includes(stop.stopId)
      && (vehicle.dataSource === 'DEMO' || isVehicleApproachingStop(route, stop.stopId, vehicle.direction, vehicle.currentStopId, vehicle.nextStopId));
  }).map(vehicle => {
    const route = routes.find(item => item.routeId === vehicle.routeId);
    const distanceMeters = haversineDistanceMeters(vehicle.latitude, vehicle.longitude, stop.latitude, stop.longitude);
    const isApproaching = route ? isVehicleApproachingStop(route, stop.stopId, vehicle.direction, vehicle.currentStopId, vehicle.nextStopId) : false;
    const nextCycleWait = vehicle.dataSource === 'DEMO' && !isApproaching ? 18 : 0;
    const liveTripUpdate = tripUpdates
      .filter((update) => update.tripId === vehicle.tripId || update.vehicleId === vehicle.vehicleId)
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))[0];
    const liveStopUpdate = liveTripUpdate?.stopTimeUpdates.find((update) => update.stopId === stop.stopId && update.etaMinutes !== null);
    const gpsEtaMinutes = Math.max(1, Math.round(distanceMeters / ((vehicle.speed || 20) * 1000 / 60)) + nextCycleWait);
    const etaMinutes = liveStopUpdate?.etaMinutes ?? gpsEtaMinutes;
    const destinationStopId = vehicle.direction === 'INBOUND' ? route?.stopIds[0] : route?.stopIds.at(-1);
    return { routeId: vehicle.routeId, routeNumber: route?.routeNumber || vehicle.routeId, vehicleId: vehicle.vehicleId, direction: vehicle.direction, destination: destinationStopId || route?.destination || 'Bengaluru', distanceMeters: Math.round(distanceMeters), etaMinutes, etaConfidence: liveStopUpdate ? 95 : 68, etaSource: liveStopUpdate ? 'LIVE_TRIP_UPDATE' as const : vehicle.dataSource === 'DEMO' ? 'DEMO' as const : 'GPS_ESTIMATE' as const, delayMinutes: liveStopUpdate?.delaySeconds === null || liveStopUpdate?.delaySeconds === undefined ? 0 : Math.round(liveStopUpdate.delaySeconds / 60), crowd: vehicle.occupancy, isLive: vehicle.isLive, dataSource: vehicle.dataSource };
  }).sort((a, b) => a.etaMinutes - b.etaMinutes);
}
