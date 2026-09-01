import staticFixture from '../../fixtures/bmtc/gtfs-static.json';
import realtimeFixture from '../../fixtures/bmtc/gtfs-realtime.json';
import type { GtfsStaticFiles, GtfsTripUpdateInput, GtfsVehicleInput } from '../../types/gtfs';
import type { TransitRealtimeProvider } from '../../types/transit';
import { normalizeGtfsStatic, normalizeGtfsTripUpdate, normalizeGtfsVehicle } from './gtfs/gtfsNormalizer';

interface FixtureVehicle extends Omit<GtfsVehicleInput, 'timestampSeconds'> {
  timestampAgeSeconds: number;
}

interface FixtureTripUpdate extends Omit<GtfsTripUpdateInput, 'timestampSeconds' | 'stopTimeUpdates'> {
  timestampAgeSeconds: number;
  stopTimeUpdates: Array<{
    stopId: string;
    stopSequence: number;
    arrivalInSeconds: number;
    departureInSeconds: number;
    delaySeconds: number;
  }>;
}

export class FixtureBmtcProvider implements TransitRealtimeProvider {
  readonly providerType = 'FIXTURE' as const;
  private readonly staticData = normalizeGtfsStatic(staticFixture as GtfsStaticFiles);

  async getRoutes() {
    return this.staticData.routes.map((route) => ({ ...route, source: 'DEMO' as const }));
  }

  async getStops() {
    return this.staticData.stops.map((stop) => ({ ...stop, source: 'DEMO' as const }));
  }

  async getVehiclePositions() {
    const now = new Date();
    return (realtimeFixture.vehicles as FixtureVehicle[]).flatMap((fixture) => {
      const vehicle = normalizeGtfsVehicle({
        ...fixture,
        timestampSeconds: Math.floor(now.getTime() / 1000) - fixture.timestampAgeSeconds,
      }, this.staticData, 120, now);
      return vehicle ? [{
        ...vehicle,
        occupancy: { ...vehicle.occupancy, crowdSource: 'DEMO' as const },
        dataSource: 'DEMO' as const,
        isLive: false,
      }] : [];
    });
  }

  async getTripUpdates() {
    const now = new Date();
    return (realtimeFixture.tripUpdates as FixtureTripUpdate[]).flatMap((fixture) => {
      const timestampSeconds = Math.floor(now.getTime() / 1000) - fixture.timestampAgeSeconds;
      const update = normalizeGtfsTripUpdate({
        ...fixture,
        timestampSeconds,
        stopTimeUpdates: fixture.stopTimeUpdates.map((stop) => ({
          stopId: stop.stopId,
          stopSequence: stop.stopSequence,
          arrivalTimeSeconds: Math.floor(now.getTime() / 1000) + stop.arrivalInSeconds,
          departureTimeSeconds: Math.floor(now.getTime() / 1000) + stop.departureInSeconds,
          delaySeconds: stop.delaySeconds,
        })),
      }, this.staticData, now);
      return update ? [{
        ...update,
        dataSource: 'DEMO' as const,
        stopTimeUpdates: update.stopTimeUpdates.map((stop) => ({ ...stop, etaSource: 'DEMO' as const })),
      }] : [];
    });
  }

  async getServiceAlerts() {
    return [];
  }
}
