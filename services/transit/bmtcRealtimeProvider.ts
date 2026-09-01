import type { NormalizedGtfsStatic } from '../../types/gtfs';
import type { TransitFeedHealth, TransitRealtimeProvider } from '../../types/transit';
import { normalizeGtfsAlert, normalizeGtfsStatic, normalizeGtfsTripUpdate, normalizeGtfsVehicle } from './gtfs/gtfsNormalizer';
import { loadGtfsRealtime } from './gtfs/gtfsRealtimeLoader';
import { loadGtfsStatic } from './gtfs/gtfsStaticLoader';

export interface BmtcRealtimeProviderConfig {
  vehiclePositionsUrl: string;
  tripUpdatesUrl: string | null;
  alertsUrl: string | null;
  gtfsStaticUrl: string;
  apiKey: string | null;
  apiKeyHeader: string;
  requestTimeoutMs: number;
  staleAfterSeconds: number;
  sourceName: string;
  sourceTermsUrl: string;
}

export class BmtcRealtimeProvider implements TransitRealtimeProvider {
  readonly providerType = 'GTFS_RT' as const;
  private staticDataPromise: Promise<NormalizedGtfsStatic> | null = null;
  private lastLatencyMs: number | null = null;
  private lastSuccessfulFetch: string | null = null;

  constructor(private readonly config: BmtcRealtimeProviderConfig) {}

  private headers() {
    const headers: Record<string, string> = { Accept: 'application/x-protobuf, application/octet-stream' };
    if (this.config.apiKey) headers[this.config.apiKeyHeader] = this.config.apiKey;
    return headers;
  }

  private getStaticData() {
    if (!this.staticDataPromise) {
      this.staticDataPromise = loadGtfsStatic(this.config.gtfsStaticUrl, {
        timeoutMs: this.config.requestTimeoutMs,
        headers: this.headers(),
      }).then(normalizeGtfsStatic).catch((error) => {
        this.staticDataPromise = null;
        throw error;
      });
    }
    return this.staticDataPromise;
  }

  async getRoutes() {
    return (await this.getStaticData()).routes;
  }

  async getStops() {
    return (await this.getStaticData()).stops;
  }

  async getStaticValidationContext() {
    const data = await this.getStaticData();
    return {
      tripIds: data.trips.map((trip) => trip.tripId),
      routeIds: data.routes.map((route) => route.routeId),
      stopIds: data.stops.map((stop) => stop.stopId),
    };
  }

  async getVehiclePositions() {
    const staticData = await this.getStaticData();
    const realtime = await loadGtfsRealtime(this.config.vehiclePositionsUrl, {
      timeoutMs: this.config.requestTimeoutMs,
      headers: this.headers(),
    });
    this.lastLatencyMs = realtime.latencyMs;
    this.lastSuccessfulFetch = new Date().toISOString();
    return realtime.vehicles.flatMap((input) => {
      const vehicle = normalizeGtfsVehicle(input, staticData, this.config.staleAfterSeconds);
      return vehicle ? [vehicle] : [];
    });
  }

  async getTripUpdates() {
    if (!this.config.tripUpdatesUrl) return [];
    const staticData = await this.getStaticData();
    const realtime = await loadGtfsRealtime(this.config.tripUpdatesUrl, {
      timeoutMs: this.config.requestTimeoutMs,
      headers: this.headers(),
    });
    this.lastLatencyMs = Math.max(this.lastLatencyMs ?? 0, realtime.latencyMs);
    return realtime.tripUpdates.flatMap((input) => {
      const update = normalizeGtfsTripUpdate(input, staticData);
      return update ? [update] : [];
    });
  }

  async getServiceAlerts() {
    if (!this.config.alertsUrl) return [];
    const realtime = await loadGtfsRealtime(this.config.alertsUrl, {
      timeoutMs: this.config.requestTimeoutMs,
      headers: this.headers(),
    });
    this.lastLatencyMs = Math.max(this.lastLatencyMs ?? 0, realtime.latencyMs);
    return realtime.alerts.map(normalizeGtfsAlert);
  }

  async getFeedHealth(): Promise<Partial<TransitFeedHealth>> {
    return {
      provider: 'GTFS_RT',
      configured: true,
      configurationValid: true,
      sourceName: this.config.sourceName,
      sourceTermsUrl: this.config.sourceTermsUrl,
      lastSuccessfulFetch: this.lastSuccessfulFetch,
      feedLatencyMs: this.lastLatencyMs,
    };
  }
}
