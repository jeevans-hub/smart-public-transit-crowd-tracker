function stableHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function normalizeGtfsIdentifier(
  kind: 'route' | 'trip' | 'stop' | 'vehicle',
  rawId: string,
): string {
  const trimmed = rawId.trim();
  const safe = trimmed.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 72) || 'unknown';
  return `gtfs:${kind}:${safe}:${stableHash(trimmed)}`;
}

export function normalizeGtfsRouteId(rawRouteId: string): string {
  return normalizeGtfsIdentifier('route', rawRouteId);
}

export function normalizeGtfsStopId(rawStopId: string): string {
  return normalizeGtfsIdentifier('stop', rawStopId);
}

export function normalizeGtfsVehicleId(rawVehicleId: string): string {
  return normalizeGtfsIdentifier('vehicle', rawVehicleId);
}
