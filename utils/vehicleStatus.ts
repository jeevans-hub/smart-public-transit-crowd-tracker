import { LiveVehicleStatus } from '@/types/vehicle';

const OFFLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

export function determineVehicleStatus(
  speed: number,
  lastUpdated: Date,
  isDelayed: boolean = false
): LiveVehicleStatus {
  const now = new Date();
  const timeSinceUpdate = now.getTime() - new Date(lastUpdated).getTime();

  // Check if offline (no update for 2 minutes)
  if (timeSinceUpdate > OFFLINE_THRESHOLD_MS) {
    return 'OFFLINE';
  }

  // Check if explicitly delayed
  if (isDelayed) {
    return 'DELAYED';
  }

  // Determine based on speed
  if (speed === 0) {
    return 'STOPPED';
  }

  return 'MOVING';
}

export function isVehicleOffline(lastUpdated: Date): boolean {
  const now = new Date();
  const timeSinceUpdate = now.getTime() - new Date(lastUpdated).getTime();
  return timeSinceUpdate > OFFLINE_THRESHOLD_MS;
}

export function getStatusColor(status: LiveVehicleStatus): string {
  switch (status) {
    case 'MOVING':
      return '#22c55e'; // Green
    case 'STOPPED':
      return '#eab308'; // Yellow
    case 'DELAYED':
      return '#f97316'; // Orange
    case 'OFFLINE':
      return '#6b7280'; // Gray
    default:
      return '#6b7280';
  }
}

export function getStatusLabel(status: LiveVehicleStatus): string {
  switch (status) {
    case 'MOVING':
      return 'Moving';
    case 'STOPPED':
      return 'Stopped';
    case 'DELAYED':
      return 'Delayed';
    case 'OFFLINE':
      return 'Offline';
    default:
      return 'Unknown';
  }
}
