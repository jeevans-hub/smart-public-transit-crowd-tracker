import { normalizeGtfsIdentifier } from './gtfsRouteMatcher.ts';

export function normalizeGtfsTripId(rawTripId: string): string {
  return normalizeGtfsIdentifier('trip', rawTripId);
}

export function directionFromGtfs(directionId: number | null | undefined) {
  return directionId === 1 ? 'INBOUND' as const : 'OUTBOUND' as const;
}
