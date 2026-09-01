import type { CrowdEstimate, TransitCrowdLevel } from '../types/transit';

const OCCUPANCY_NAMES = [
  'EMPTY',
  'MANY_SEATS_AVAILABLE',
  'FEW_SEATS_AVAILABLE',
  'STANDING_ROOM_ONLY',
  'CRUSHED_STANDING_ROOM_ONLY',
  'FULL',
  'NOT_ACCEPTING_PASSENGERS',
  'NO_DATA_AVAILABLE',
  'NOT_BOARDABLE',
] as const;

function levelForPercentage(value: number): TransitCrowdLevel {
  if (value < 35) return 'LOW';
  if (value < 65) return 'MEDIUM';
  if (value < 85) return 'HIGH';
  return 'VERY_HIGH';
}

export function mapGtfsOccupancy(
  occupancyStatus: number | null,
  occupancyPercentage: number | null,
): CrowdEstimate & { rawOccupancyStatus: string | null } {
  const hasPercentage = occupancyPercentage !== null
    && Number.isFinite(occupancyPercentage)
    && occupancyPercentage >= 0
    && occupancyPercentage <= 100;
  const rawOccupancyStatus = occupancyStatus === null
    ? null
    : OCCUPANCY_NAMES[occupancyStatus] ?? `UNKNOWN_${occupancyStatus}`;

  if (hasPercentage) {
    const crowdScore = Math.round(occupancyPercentage);
    return {
      crowdLevel: levelForPercentage(crowdScore),
      crowdScore,
      crowdConfidence: 92,
      crowdSource: 'LIVE_OCCUPANCY',
      passengerCount: null,
      rawOccupancyStatus,
    };
  }

  const mapped: Partial<Record<number, { level: TransitCrowdLevel; score: number }>> = {
    0: { level: 'LOW', score: 5 },
    1: { level: 'LOW', score: 25 },
    2: { level: 'MEDIUM', score: 52 },
    3: { level: 'HIGH', score: 74 },
    4: { level: 'VERY_HIGH', score: 92 },
    5: { level: 'VERY_HIGH', score: 98 },
    6: { level: 'VERY_HIGH', score: 100 },
  };
  const value = occupancyStatus === null ? undefined : mapped[occupancyStatus];
  if (value) {
    return {
      crowdLevel: value.level,
      crowdScore: value.score,
      crowdConfidence: 88,
      crowdSource: 'LIVE_OCCUPANCY',
      passengerCount: null,
      rawOccupancyStatus,
    };
  }

  return {
    crowdLevel: 'MEDIUM',
    crowdScore: 50,
    crowdConfidence: 0,
    crowdSource: 'HISTORICAL_PREDICTION',
    passengerCount: null,
    rawOccupancyStatus,
  };
}
