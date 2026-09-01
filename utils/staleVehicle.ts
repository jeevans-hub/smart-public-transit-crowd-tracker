import type { TransitVehicle } from '../types/transit';

export function isVehicleStale(
  timestamp: string,
  staleAfterSeconds: number,
  now = new Date(),
): boolean {
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) return true;
  if (timestampMs - now.getTime() > 60_000) return true;
  return now.getTime() - timestampMs > staleAfterSeconds * 1000;
}

export function applyVehicleFreshness(
  vehicles: TransitVehicle[],
  staleAfterSeconds: number,
  now = new Date(),
): TransitVehicle[] {
  return vehicles.map((vehicle) => ({
    ...vehicle,
    isLive: vehicle.dataSource !== 'DEMO'
      && !isVehicleStale(vehicle.timestamp, staleAfterSeconds, now),
  }));
}

export function newestVehicleAgeSeconds(
  vehicles: TransitVehicle[],
  now = new Date(),
): number | null {
  const timestamps = vehicles
    .map((vehicle) => Date.parse(vehicle.timestamp))
    .filter(Number.isFinite);
  if (timestamps.length === 0) return null;
  return Math.max(0, Math.floor((now.getTime() - Math.max(...timestamps)) / 1000));
}
