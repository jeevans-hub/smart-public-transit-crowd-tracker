import { CROWD_THRESHOLDS } from './constants.ts';

/**
 * Calculate occupancy percentage from passenger count and vehicle capacity
 */
export function calculateOccupancyPercentage(passengerCount: number, vehicleCapacity: number): number {
  if (vehicleCapacity <= 0) return 0;
  return Math.round((passengerCount / vehicleCapacity) * 100);
}

/**
 * Calculate crowd level from occupancy percentage
 */
export function calculateCrowdLevel(occupancyPercentage: number): 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL' {
  if (occupancyPercentage <= CROWD_THRESHOLDS.EMPTY) return 'EMPTY';
  if (occupancyPercentage <= CROWD_THRESHOLDS.LOW) return 'LOW';
  if (occupancyPercentage <= CROWD_THRESHOLDS.MEDIUM) return 'MEDIUM';
  if (occupancyPercentage <= CROWD_THRESHOLDS.HIGH) return 'HIGH';
  return 'FULL';
}

/**
 * Calculate average occupancy from an array of occupancy percentages
 */
export function calculateAverageOccupancy(occupancies: number[]): number {
  if (occupancies.length === 0) return 0;
  const sum = occupancies.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / occupancies.length);
}

/**
 * Calculate passenger count from occupancy percentage and vehicle capacity
 */
export function calculatePassengerCount(occupancyPercentage: number, vehicleCapacity: number): number {
  return Math.round((occupancyPercentage / 100) * vehicleCapacity);
}

/**
 * Calculate capacity utilization for a station based on multiple reports
 */
export function calculateStationUtilization(reports: { occupancyPercentage: number }[]): number {
  if (reports.length === 0) return 0;
  return calculateAverageOccupancy(reports.map(r => r.occupancyPercentage));
}

/**
 * Calculate route utilization across all vehicles on the route
 */
export function calculateRouteUtilization(reports: { occupancyPercentage: number }[]): number {
  if (reports.length === 0) return 0;
  return calculateAverageOccupancy(reports.map(r => r.occupancyPercentage));
}

/**
 * Calculate the change percentage between two values
 */
export function calculateChangePercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
}

/**
 * Calculate crowd distribution statistics
 */
export function calculateCrowdDistribution(reports: { occupancyPercentage: number }[]): {
  empty: number;
  low: number;
  medium: number;
  high: number;
  full: number;
} {
  const distribution = {
    empty: 0,
    low: 0,
    medium: 0,
    high: 0,
    full: 0,
  };

  reports.forEach(report => {
    const level = calculateCrowdLevel(report.occupancyPercentage);
    distribution[level.toLowerCase() as keyof typeof distribution]++;
  });

  return distribution;
}
