import type { TransitVehicle } from '../types/transit';

export type TransitPositionStatus = 'VALID' | 'SUSPICIOUS' | 'INVALID';
export type TransitPositionReason = 'INVALID_COORDINATES' | 'FUTURE_TIMESTAMP' | 'IMPOSSIBLE_SPEED' | 'DUPLICATE' | 'STALE';

export interface TransitPositionValidation {
  status: TransitPositionStatus;
  reasons: TransitPositionReason[];
  calculatedSpeedKph: number | null;
}

interface PositionOptions {
  now?: Date;
  staleAfterSeconds?: number;
  futureToleranceSeconds?: number;
  suspiciousSpeedKph?: number;
  impossibleSpeedKph?: number;
  previous?: TransitVehicle;
}

function distanceKm(a: TransitVehicle, b: TransitVehicle): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export function validateTransitPosition(vehicle: TransitVehicle, options: PositionOptions = {}): TransitPositionValidation {
  const now = options.now ?? new Date();
  const staleAfterSeconds = options.staleAfterSeconds ?? 120;
  const timestamp = Date.parse(vehicle.timestamp);
  const reasons: TransitPositionReason[] = [];
  let calculatedSpeedKph: number | null = null;

  if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)
    || vehicle.latitude < -90 || vehicle.latitude > 90 || vehicle.longitude < -180 || vehicle.longitude > 180
    || (vehicle.latitude === 0 && vehicle.longitude === 0)) reasons.push('INVALID_COORDINATES');
  if (!Number.isFinite(timestamp) || timestamp - now.getTime() > (options.futureToleranceSeconds ?? 30) * 1000) reasons.push('FUTURE_TIMESTAMP');
  if (Number.isFinite(timestamp) && now.getTime() - timestamp > staleAfterSeconds * 1000) reasons.push('STALE');

  if (options.previous && Number.isFinite(timestamp)) {
    const previousTime = Date.parse(options.previous.timestamp);
    const elapsedHours = (timestamp - previousTime) / 3_600_000;
    const unchanged = elapsedHours === 0
      && vehicle.latitude === options.previous.latitude
      && vehicle.longitude === options.previous.longitude;
    if (unchanged) reasons.push('DUPLICATE');
    if (elapsedHours > 0) {
      calculatedSpeedKph = distanceKm(options.previous, vehicle) / elapsedHours;
      if (calculatedSpeedKph > (options.suspiciousSpeedKph ?? 120)) reasons.push('IMPOSSIBLE_SPEED');
    }
  }

  const invalid = reasons.includes('INVALID_COORDINATES') || reasons.includes('FUTURE_TIMESTAMP')
    || (reasons.includes('IMPOSSIBLE_SPEED') && (calculatedSpeedKph ?? 0) > (options.impossibleSpeedKph ?? 180));
  return { status: invalid ? 'INVALID' : reasons.length > 0 ? 'SUSPICIOUS' : 'VALID', reasons, calculatedSpeedKph };
}
