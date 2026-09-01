import type { RouteCompatibilityResult } from '../types/recommendation.ts';
import type { TransitRoute, TransitVehicleDirection } from '../types/transit.ts';

export function getDirectionalStopIds(
  route: TransitRoute,
  direction: TransitVehicleDirection,
): string[] {
  return direction === 'INBOUND' ? [...route.stopIds].reverse() : [...route.stopIds];
}

export function checkRouteCompatibility(
  route: TransitRoute,
  originStopId: string,
  destinationStopId: string,
  direction: TransitVehicleDirection,
): RouteCompatibilityResult {
  const effectiveStopIds = getDirectionalStopIds(route, direction);
  const originIndex = effectiveStopIds.indexOf(originStopId);
  const destinationIndex = effectiveStopIds.indexOf(destinationStopId);

  if (originStopId === destinationStopId) {
    return { compatible: false, reason: 'Origin and destination must be different stops', originIndex, destinationIndex, effectiveStopIds };
  }
  if (originIndex < 0) {
    return { compatible: false, reason: 'The route does not serve the selected boarding stop', originIndex, destinationIndex, effectiveStopIds };
  }
  if (destinationIndex < 0) {
    return { compatible: false, reason: 'The route does not serve the selected destination', originIndex, destinationIndex, effectiveStopIds };
  }
  if (originIndex >= destinationIndex) {
    return { compatible: false, reason: 'The bus is traveling in the wrong direction for this destination', originIndex, destinationIndex, effectiveStopIds };
  }
  return { compatible: true, reason: 'The bus serves the destination in the current direction', originIndex, destinationIndex, effectiveStopIds };
}

export function isVehicleApproachingStop(
  route: TransitRoute,
  stopId: string,
  direction: TransitVehicleDirection,
  currentStopId?: string | null,
  nextStopId?: string | null,
): boolean {
  const stopIds = getDirectionalStopIds(route, direction);
  const targetIndex = stopIds.indexOf(stopId);
  if (targetIndex < 0) return false;
  if (currentStopId === stopId) return true;

  const nextIndex = nextStopId ? stopIds.indexOf(nextStopId) : -1;
  if (nextIndex >= 0) return targetIndex >= nextIndex;

  const currentIndex = currentStopId ? stopIds.indexOf(currentStopId) : -1;
  return currentIndex < 0 || targetIndex >= currentIndex;
}
