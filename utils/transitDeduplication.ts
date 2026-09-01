import type { TransitVehicle } from '../types/transit';

export function vehicleUpdateVersion(vehicle: TransitVehicle): string {
  return [
    vehicle.timestamp,
    vehicle.latitude.toFixed(6),
    vehicle.longitude.toFixed(6),
    vehicle.routeId,
    vehicle.tripId,
    vehicle.currentStopId || '',
    vehicle.nextStopId || '',
    vehicle.rawOccupancyStatus || '',
    vehicle.occupancy.crowdScore,
  ].join('|');
}

export function rejectDuplicateVehicleUpdates(
  vehicles: TransitVehicle[],
  versions: Map<string, string>,
): TransitVehicle[] {
  const accepted: TransitVehicle[] = [];
  for (const vehicle of vehicles) {
    const version = vehicleUpdateVersion(vehicle);
    if (versions.get(vehicle.vehicleId) === version) continue;
    versions.set(vehicle.vehicleId, version);
    accepted.push(vehicle);
  }
  return accepted;
}
