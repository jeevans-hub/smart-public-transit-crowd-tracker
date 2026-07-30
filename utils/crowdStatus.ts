import { CROWD_THRESHOLDS } from './constants';

export type DashboardStatus = 'healthy' | 'moderate' | 'high' | 'critical';

/**
 * Convert crowd level to dashboard status
 */
export function crowdLevelToDashboardStatus(crowdLevel: 'EMPTY' | 'LOW' | 'MEDIUM' | 'HIGH' | 'FULL'): DashboardStatus {
  switch (crowdLevel) {
    case 'EMPTY':
    case 'LOW':
      return 'healthy';
    case 'MEDIUM':
      return 'moderate';
    case 'HIGH':
      return 'high';
    case 'FULL':
      return 'critical';
    default:
      return 'healthy';
  }
}

/**
 * Convert occupancy percentage to dashboard status
 */
export function occupancyToDashboardStatus(occupancyPercentage: number): DashboardStatus {
  if (occupancyPercentage <= CROWD_THRESHOLDS.LOW) return 'healthy';
  if (occupancyPercentage <= CROWD_THRESHOLDS.MEDIUM) return 'moderate';
  if (occupancyPercentage <= CROWD_THRESHOLDS.HIGH) return 'high';
  return 'critical';
}

/**
 * Get status color class for dashboard status
 */
export function getStatusColorClass(status: DashboardStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Get status text color class
 */
export function getStatusTextColorClass(status: DashboardStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-700';
    case 'moderate':
      return 'text-yellow-700';
    case 'high':
      return 'text-orange-700';
    case 'critical':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
}

/**
 * Get status border color class
 */
export function getStatusBorderColorClass(status: DashboardStatus): string {
  switch (status) {
    case 'healthy':
      return 'border-green-500';
    case 'moderate':
      return 'border-yellow-500';
    case 'high':
      return 'border-orange-500';
    case 'critical':
      return 'border-red-500';
    default:
      return 'border-gray-500';
  }
}

/**
 * Get alert priority from status
 */
export function statusToAlertPriority(status: DashboardStatus): 'low' | 'medium' | 'high' | 'critical' {
  switch (status) {
    case 'healthy':
      return 'low';
    case 'moderate':
      return 'medium';
    case 'high':
      return 'high';
    case 'critical':
      return 'critical';
    default:
      return 'low';
  }
}

/**
 * Determine if status requires immediate attention
 */
export function requiresImmediateAttention(status: DashboardStatus): boolean {
  return status === 'critical' || status === 'high';
}

/**
 * Get status description
 */
export function getStatusDescription(status: DashboardStatus): string {
  switch (status) {
    case 'healthy':
      return 'Normal operations';
    case 'moderate':
      return 'Moderate crowding';
    case 'high':
      return 'High crowding - monitor';
    case 'critical':
      return 'Critical - take action';
    default:
      return 'Unknown status';
  }
}
