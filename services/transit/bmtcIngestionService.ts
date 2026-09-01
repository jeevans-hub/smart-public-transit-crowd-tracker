import connectDB from '../../lib/mongodb';
import BmtcRealtimeVehicle from '../../models/BmtcRealtimeVehicle';
import { socketServer } from '../../server/socket';
import type {
  TransitFeedHealth,
  TransitRoute,
  TransitServiceAlert,
  TransitStop,
  TransitTripUpdate,
  TransitVehicle,
} from '../../types/transit';
import { SERVER_EVENTS } from '../../utils/eventNames';
import { applyVehicleFreshness, isVehicleStale } from '../../utils/staleVehicle';
import { rejectDuplicateVehicleUpdates } from '../../utils/transitDeduplication';
import { validateTransitPosition } from '../../utils/transitPositionValidator';
import { GtfsRealtimeFetchError } from './gtfs/gtfsRealtimeLoader';
import { liveActivationService } from './liveActivationService';
import { calculateFreshnessMetrics, calculateMappingMetrics, verifyGenericBmtcFeed } from './liveFeedValidationService';
import { providerHealthService } from './providerHealthService';
import { providerReliabilityService } from './providerReliabilityService';
import { createTransitProvider, type TransitProviderSelection } from './transitProviderFactory';

export interface BmtcDataSnapshot {
  routes: TransitRoute[];
  stops: TransitStop[];
  vehicles: TransitVehicle[];
  tripUpdates: TransitTripUpdate[];
  serviceAlerts: TransitServiceAlert[];
  dataSource: 'BMTC_REALTIME' | 'EXTERNAL' | 'DEMO';
  providerStatus: TransitFeedHealth;
}

const DEFAULT_STALE_SECONDS = 120;

function structuredWarning(event: string, error: unknown, details: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message.replace(/https?:\/\/[^\s]+/gi, '[provider endpoint]') : 'Unknown error';
  console.warn('[BMTC Provider]', { event, message: message.slice(0, 300), ...details });
}

export class BmtcIngestionService {
  private readonly selection: TransitProviderSelection;
  private routes: TransitRoute[] = [];
  private stops: TransitStop[] = [];
  private vehicles = new Map<string, TransitVehicle>();
  private tripUpdates: TransitTripUpdate[] = [];
  private serviceAlerts: TransitServiceAlert[] = [];
  private versions = new Map<string, string>();
  private tripUpdateFingerprint = '';
  private serviceAlertFingerprint = '';
  private refreshPromise: Promise<void> | null = null;
  private timer: NodeJS.Timeout | null = null;
  private nextAttemptAt = 0;
  private started = false;
  private lastEmittedStatus = '';

  constructor(selection = createTransitProvider()) {
    this.selection = selection;
    if ((selection.mode === 'GTFS_RT' || selection.mode === 'MOOVIT') && selection.config) {
      const metadata = selection.provider.getProviderMetadata?.();
      providerHealthService.beginRealProvider(selection.mode, selection.config.sourceName, selection.config.sourceTermsUrl, metadata);
      console.info('[BMTC Provider]', { event: 'provider-selected', provider: selection.mode, sourceName: selection.config.sourceName });
    } else {
      providerHealthService.setDemo(selection.reason, selection.configured, selection.configurationValid, selection.requestedProvider);
      console.info('[BMTC Provider]', { event: 'provider-selected', provider: selection.requestedProvider, reason: selection.reason });
    }
  }

  private get refreshIntervalMs() {
    return this.selection.config?.refreshIntervalMs ?? 30_000;
  }

  private get staleAfterSeconds() {
    return this.selection.config?.staleAfterSeconds ?? DEFAULT_STALE_SECONDS;
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.refresh();
    this.timer = setInterval(() => { void this.refresh(); }, this.refreshIntervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.started = false;
  }

  async refresh(): Promise<void> {
    if (this.refreshPromise) return this.refreshPromise;
    if (Date.now() < this.nextAttemptAt) return;
    this.refreshPromise = this.refreshInternal().finally(() => { this.refreshPromise = null; });
    return this.refreshPromise;
  }

  private async refreshInternal(): Promise<void> {
    if ((this.selection.mode !== 'GTFS_RT' && this.selection.mode !== 'MOOVIT') || !this.selection.config) {
      await this.loadNonLiveProvider();
      return;
    }
    const startedAt = Date.now();
    try {
      const provider = this.selection.provider;
      const [routes, stops, incomingVehicles, tripUpdates, serviceAlerts, validationContext] = await Promise.all([
        provider.getRoutes(),
        provider.getStops(),
        provider.getVehiclePositions(),
        provider.getTripUpdates?.() ?? Promise.resolve([]),
        provider.getServiceAlerts?.() ?? Promise.resolve([]),
        provider.getStaticValidationContext?.() ?? Promise.resolve({ tripIds: [], routeIds: [], stopIds: [] }),
      ]);
      const positionResults = incomingVehicles.map((vehicle) => ({
        vehicle,
        validation: validateTransitPosition(vehicle, { previous: this.vehicles.get(vehicle.vehicleId), staleAfterSeconds: this.staleAfterSeconds }),
      }));
      const positionMetrics = {
        validCount: positionResults.filter((item) => item.validation.status === 'VALID').length,
        suspiciousCount: positionResults.filter((item) => item.validation.status === 'SUSPICIOUS').length,
        invalidCount: positionResults.filter((item) => item.validation.status === 'INVALID').length,
        rejectedCount: positionResults.filter((item) => item.validation.status === 'INVALID').length,
      };
      const validatedVehicles = positionResults.filter((item) => item.validation.status !== 'INVALID').map((item) => item.vehicle);
      const freshnessCheckedVehicles = applyVehicleFreshness(validatedVehicles, this.staleAfterSeconds);
      const verification = provider.verifySnapshot?.({
        routes,
        vehicles: freshnessCheckedVehicles,
        tripUpdates,
      }) ?? verifyGenericBmtcFeed(routes, freshnessCheckedVehicles, tripUpdates);
      const mapping = calculateMappingMetrics(freshnessCheckedVehicles, tripUpdates, validationContext, {
        good: Number(process.env.BMTC_MAPPING_GOOD_PERCENT) || 95,
        minimum: Number(process.env.BMTC_MAPPING_MIN_PERCENT) || 80,
      });
      const freshness = calculateFreshnessMetrics(freshnessCheckedVehicles, this.staleAfterSeconds);
      const activation = liveActivationService.evaluate({
        configured: true,
        authenticated: true,
        verification,
        mapping,
        freshness,
        positions: positionMetrics,
        vehicleCount: freshness.freshCount,
        requestSucceeded: true,
      });
      const verifiedSource = !verification || verification.status === 'VERIFIED';
      const freshVehicles = freshnessCheckedVehicles.map((vehicle) => ({
        ...vehicle,
        dataSource: verifiedSource ? 'BMTC_REALTIME' as const : 'EXTERNAL' as const,
      }));
      const normalizedTripUpdates = tripUpdates.map((update) => ({
        ...update,
        dataSource: verifiedSource ? 'BMTC_REALTIME' as const : 'EXTERNAL' as const,
      }));
      const normalizedServiceAlerts = serviceAlerts.map((alert) => ({
        ...alert,
        dataSource: verifiedSource ? 'BMTC_REALTIME' as const : 'EXTERNAL' as const,
      }));
      const health = providerHealthService.recordRealSuccess({
        provider: this.selection.mode,
        vehicles: freshVehicles,
        tripUpdateCount: normalizedTripUpdates.length,
        latencyMs: Date.now() - startedAt,
        sourceName: this.selection.config.sourceName,
        sourceTermsUrl: this.selection.config.sourceTermsUrl,
        staleAfterSeconds: this.staleAfterSeconds,
        verification,
        metadata: provider.getProviderMetadata?.(),
        activation,
      });
      providerReliabilityService.recordSuccess(Date.now() - startedAt, {
        provider: this.selection.mode,
        activation,
        vehicleCount: freshness.freshCount,
      });

      this.routes = routes;
      this.stops = stops;
      const freshTripUpdates = normalizedTripUpdates.filter((update) => !isVehicleStale(update.timestamp, this.staleAfterSeconds));
      const tripUpdateFingerprint = JSON.stringify(freshTripUpdates);
      const serviceAlertFingerprint = JSON.stringify(normalizedServiceAlerts);
      const tripUpdatesChanged = tripUpdateFingerprint !== this.tripUpdateFingerprint;
      const serviceAlertsChanged = serviceAlertFingerprint !== this.serviceAlertFingerprint;
      this.tripUpdates = freshTripUpdates;
      this.serviceAlerts = normalizedServiceAlerts;
      this.tripUpdateFingerprint = tripUpdateFingerprint;
      this.serviceAlertFingerprint = serviceAlertFingerprint;
      const accepted = rejectDuplicateVehicleUpdates(freshVehicles, this.versions);
      this.vehicles = new Map(freshVehicles.map((vehicle) => [vehicle.vehicleId, vehicle]));
      this.nextAttemptAt = Date.now() + this.refreshIntervalMs;
      const allowLive = activation.decision === 'ALLOW_LIVE';
      if (allowLive && accepted.length > 0) {
        await this.persistVehicles(accepted);
        if (socketServer.isActive()) {
          socketServer.broadcast(SERVER_EVENTS.BMTC_VEHICLE_UPDATE, { vehicles: accepted, timestamp: new Date().toISOString() });
          socketServer.broadcast(SERVER_EVENTS.BMTC_VEHICLE_MOVED, { vehicles: accepted, timestamp: new Date().toISOString() });
          const liveOccupancy = accepted.filter((vehicle) => vehicle.occupancy.crowdSource === 'LIVE_OCCUPANCY');
          if (liveOccupancy.length > 0) {
            socketServer.broadcast(SERVER_EVENTS.BMTC_CROWD_UPDATE, { vehicles: liveOccupancy, timestamp: new Date().toISOString() });
          }
        }
      }
      if (allowLive && socketServer.isActive() && tripUpdatesChanged && this.tripUpdates.length > 0) {
        socketServer.broadcast(SERVER_EVENTS.BMTC_ARRIVAL_UPDATE, { tripUpdates: this.tripUpdates });
      }
      if (allowLive && socketServer.isActive() && serviceAlertsChanged && this.serviceAlerts.length > 0) {
        socketServer.broadcast(SERVER_EVENTS.BMTC_ALERT, { alerts: this.serviceAlerts });
      }
      this.emitProviderStatus(health);
    } catch (error) {
      liveActivationService.recordFailure(true, error instanceof Error ? error.message : 'Provider request failed');
      providerReliabilityService.recordFailure(error, this.selection.mode);
      const health = providerHealthService.recordFailure(error, this.selection.mode);
      this.scheduleBackoff(error);
      structuredWarning('feed-refresh-failed', error, { consecutiveFailures: health.consecutiveFailures, status: health.status });
      this.emitProviderStatus(health);
    }
  }

  private async loadNonLiveProvider() {
    const [routes, stops, vehicles] = await Promise.all([
      this.selection.provider.getRoutes(),
      this.selection.provider.getStops(),
      this.selection.provider.getVehiclePositions(),
    ]);
    this.routes = routes;
    this.stops = stops;
    this.vehicles = new Map(vehicles.map((vehicle) => [vehicle.vehicleId, vehicle]));
    this.tripUpdates = await (this.selection.provider.getTripUpdates?.() ?? Promise.resolve([]));
    this.serviceAlerts = await (this.selection.provider.getServiceAlerts?.() ?? Promise.resolve([]));
  }

  private scheduleBackoff(error: unknown) {
    const failures = providerHealthService.getSnapshot().consecutiveFailures;
    const exponential = Math.min(300_000, 5_000 * (2 ** Math.max(0, failures - 1)));
    const retryAfter = error instanceof GtfsRealtimeFetchError ? error.retryAfterMs ?? 0 : 0;
    this.nextAttemptAt = Date.now() + Math.max(exponential, retryAfter);
  }

  private async persistVehicles(vehicles: TransitVehicle[]) {
    if (!process.env.MONGODB_URI || vehicles.length === 0) return;
    try {
      await connectDB();
      await BmtcRealtimeVehicle.bulkWrite(vehicles.map((vehicle) => ({
        updateOne: {
          filter: { vehicleId: vehicle.vehicleId },
          update: { $set: {
            ...vehicle,
            dataSource: vehicle.dataSource === 'EXTERNAL' ? 'EXTERNAL' as const : 'BMTC_REALTIME' as const,
            provider: vehicle.provider === 'MOOVIT' ? 'MOOVIT' as const : 'GTFS_RT' as const,
            timestamp: new Date(vehicle.timestamp),
            location: { type: 'Point', coordinates: [vehicle.longitude, vehicle.latitude] },
          } },
          upsert: true,
        },
      })), { ordered: false });
      const staleBefore = new Date(Date.now() - this.staleAfterSeconds * 1000);
      await BmtcRealtimeVehicle.updateMany(
        { timestamp: { $lt: staleBefore }, isLive: true },
        { $set: { isLive: false } },
      );
    } catch (error) {
      structuredWarning('database-persistence-failed', error, { vehicleCount: vehicles.length });
    }
  }

  private emitProviderStatus(status: TransitFeedHealth) {
    const fingerprint = `${status.status}:${status.dataSource}:${status.verificationStatus}:${status.consecutiveFailures}:${status.vehicleCount}:${status.tripUpdateCount}`;
    if (fingerprint === this.lastEmittedStatus) return;
    this.lastEmittedStatus = fingerprint;
    if (socketServer.isActive()) socketServer.broadcast(SERVER_EVENTS.BMTC_PROVIDER_STATUS, status);
  }

  async getData(options: { includeStale?: boolean } = {}): Promise<BmtcDataSnapshot> {
    const realProviderSelected = this.selection.mode === 'GTFS_RT' || this.selection.mode === 'MOOVIT';
    if (this.routes.length === 0 || this.stops.length === 0 || (realProviderSelected && Date.now() >= this.nextAttemptAt)) {
      await this.refresh();
    }
    const health = providerHealthService.markStale(this.staleAfterSeconds);
    if (health.fallbackActive) {
      const [routes, stops, vehicles] = await Promise.all([
        this.selection.demoProvider.getRoutes(),
        this.selection.demoProvider.getStops(),
        this.selection.demoProvider.getVehiclePositions(),
      ]);
      return { routes, stops, vehicles, tripUpdates: [], serviceAlerts: [], dataSource: 'DEMO', providerStatus: health };
    }
    const vehicles = applyVehicleFreshness([...this.vehicles.values()], this.staleAfterSeconds);
    return {
      routes: this.routes,
      stops: this.stops,
      vehicles: options.includeStale ? vehicles : vehicles.filter((vehicle) => vehicle.isLive),
      tripUpdates: this.tripUpdates,
      serviceAlerts: this.serviceAlerts,
      dataSource: health.realFeedVerified ? 'BMTC_REALTIME' : 'EXTERNAL',
      providerStatus: providerHealthService.getSnapshot(),
    };
  }

  getProviderStatus() {
    return providerHealthService.markStale(this.staleAfterSeconds);
  }
}

declare global {
  var bmtcIngestion: BmtcIngestionService | undefined;
}

export const bmtcIngestionService = globalThis.bmtcIngestion ?? new BmtcIngestionService();
if (!globalThis.bmtcIngestion) globalThis.bmtcIngestion = bmtcIngestionService;
