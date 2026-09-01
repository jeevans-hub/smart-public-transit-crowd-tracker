import type { NormalizedGtfsStatic } from '../../types/gtfs';
import type {
  TransitFeedHealth,
  TransitProviderMetadata,
  TransitProviderSnapshot,
  TransitProviderVerification,
  TransitRealtimeProvider,
} from '../../types/transit';
import type { MoovitHmacEncoding } from '../../utils/moovitAuth.ts';
import { createMoovitHmacAuthorization } from '../../utils/moovitAuth.ts';
import { verifyMoovitBengaluruFeed } from '../../utils/moovitVerification.ts';
import {
  decodeGtfsRealtimePayload,
  extractGtfsRealtime,
  GtfsRealtimeFetchError,
  type LoadedGtfsRealtimeFeed,
} from './gtfs/gtfsRealtimeLoader.ts';
import {
  normalizeGtfsAlert,
  normalizeGtfsStatic,
  normalizeGtfsTripUpdate,
  normalizeGtfsVehicle,
} from './gtfs/gtfsNormalizer.ts';
import { loadGtfsStatic } from './gtfs/gtfsStaticLoader.ts';

export type MoovitAuthMode = 'API_KEY' | 'HMAC';
export type MoovitFeedKind = 'vehicles' | 'trips' | 'alerts';

export interface MoovitTransitProviderConfig {
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string | null;
  authMode: MoovitAuthMode;
  hmacEncoding: MoovitHmacEncoding;
  metroId: string;
  agencyId: string | null;
  transitType: 'BUS';
  gtfsStaticUrl: string;
  requestTimeoutMs: number;
  refreshIntervalMs: number;
  staleAfterSeconds: number;
  sourceName: string;
  sourceTermsUrl: string;
}

export interface MoovitProviderDependencies {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  nonceFactory?: () => string;
  staticData?: NormalizedGtfsStatic;
}

interface CachedFeed {
  feed: LoadedGtfsRealtimeFeed;
  etag: string | null;
  freshUntil: number;
}

export interface ParsedCacheControl {
  noStore: boolean;
  noCache: boolean;
  maxAgeMs: number | null;
}

const MAX_REALTIME_BYTES = 25 * 1024 * 1024;

export function parseMoovitCacheControl(value: string | null): ParsedCacheControl {
  const directives = (value ?? '').split(',').map((part) => part.trim().toLowerCase());
  const maxAge = directives.find((directive) => directive.startsWith('max-age='));
  const parsedMaxAge = maxAge ? Number(maxAge.slice('max-age='.length).replace(/^"|"$/g, '')) : Number.NaN;
  return {
    noStore: directives.includes('no-store'),
    noCache: directives.includes('no-cache'),
    maxAgeMs: Number.isFinite(parsedMaxAge) && parsedMaxAge >= 0 ? parsedMaxAge * 1000 : null,
  };
}

function parseRetryAfter(value: string | null, nowMs: number): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - nowMs) : null;
}

function endpointUrl(config: MoovitTransitProviderConfig, kind: MoovitFeedKind): URL {
  const endpoint = kind === 'alerts' ? 'SaRtGtfs' : 'RtGtfs';
  const url = new URL(endpoint, `${config.apiBaseUrl.replace(/\/+$/, '')}/`);
  url.searchParams.set('metroId', config.metroId);
  url.searchParams.set('transitType', config.transitType);
  if (config.agencyId) url.searchParams.set('agencyId', config.agencyId);
  if (kind === 'vehicles') url.searchParams.set('vehiclePositions', '1');
  return url;
}

export class MoovitTransitProvider implements TransitRealtimeProvider {
  readonly providerType = 'MOOVIT' as const;
  private readonly config: MoovitTransitProviderConfig;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => Date;
  private readonly nonceFactory: () => string | undefined;
  private staticDataPromise: Promise<NormalizedGtfsStatic> | null = null;
  private readonly feedCache = new Map<MoovitFeedKind, CachedFeed>();
  private lastLatencyMs: number | null = null;
  private lastSuccessfulFetch: string | null = null;
  private vehicleCount = 0;
  private tripUpdateCount = 0;
  private lastVerification: TransitProviderVerification = {
    status: 'UNVERIFIED',
    reason: 'Moovit feed has not been fetched and verified',
    bengaluruPlausible: null,
    routeMatchCount: 0,
    freshVehicleCount: 0,
  };

  constructor(
    config: MoovitTransitProviderConfig,
    dependencies: MoovitProviderDependencies = {},
  ) {
    this.config = config;
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.now = dependencies.now ?? (() => new Date());
    this.nonceFactory = dependencies.nonceFactory ?? (() => undefined);
    if (dependencies.staticData) this.staticDataPromise = Promise.resolve(dependencies.staticData);
  }

  private requestHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/x-protobuf, application/octet-stream, application/json',
      'Content-Type': 'application/json',
      API_KEY: this.config.apiKey,
      MOOVIT_METRO_ID: this.config.metroId,
      MOOVIT_PROTOCOL_VERSION: '5.1.0.0',
    };
    if (this.config.authMode === 'HMAC') {
      const authorization = createMoovitHmacAuthorization({
        secret: this.config.apiSecret ?? '',
        payload: '',
        timestamp: this.now().getTime(),
        nonce: this.nonceFactory(),
        encoding: this.config.hmacEncoding,
      });
      headers.Authorization = authorization.authorization;
    }
    return headers;
  }

  private getStaticData(): Promise<NormalizedGtfsStatic> {
    if (!this.staticDataPromise) {
      this.staticDataPromise = loadGtfsStatic(this.config.gtfsStaticUrl, {
        timeoutMs: this.config.requestTimeoutMs,
      }).then(normalizeGtfsStatic).catch((error) => {
        this.staticDataPromise = null;
        throw error;
      });
    }
    return this.staticDataPromise;
  }

  private async fetchFeed(kind: MoovitFeedKind): Promise<LoadedGtfsRealtimeFeed> {
    const nowMs = this.now().getTime();
    const cached = this.feedCache.get(kind);
    if (cached && nowMs < cached.freshUntil) return cached.feed;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    const startedAt = Date.now();
    try {
      const headers = this.requestHeaders();
      if (cached?.etag) headers['If-None-Match'] = cached.etag;
      const response = await this.fetchImpl(endpointUrl(this.config, kind), {
        method: 'GET',
        cache: 'no-store',
        headers,
        signal: controller.signal,
      });
      const cacheControlHeader = response.headers.get('cache-control');
      const cacheControl = parseMoovitCacheControl(cacheControlHeader);
      const responseEtag = response.headers.get('etag') ?? cached?.etag ?? null;

      if (response.status === 304) {
        if (!cached) throw new GtfsRealtimeFetchError('Moovit returned 304 without a cached feed', 304);
        cached.freshUntil = cacheControl.maxAgeMs === null ? nowMs : nowMs + cacheControl.maxAgeMs;
        cached.etag = responseEtag;
        this.lastLatencyMs = Date.now() - startedAt;
        this.lastSuccessfulFetch = this.now().toISOString();
        return cached.feed;
      }
      if (!response.ok) {
        throw new GtfsRealtimeFetchError(
          `Moovit ${kind} request failed with HTTP ${response.status}`,
          response.status,
          parseRetryAfter(response.headers.get('retry-after'), nowMs),
        );
      }

      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > MAX_REALTIME_BYTES) {
        throw new GtfsRealtimeFetchError(`Moovit ${kind} response exceeds the safe size limit`);
      }
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength === 0) throw new GtfsRealtimeFetchError(`Moovit ${kind} feed is empty`);
      if (bytes.byteLength > MAX_REALTIME_BYTES) {
        throw new GtfsRealtimeFetchError(`Moovit ${kind} response exceeds the safe size limit`);
      }

      const latencyMs = Date.now() - startedAt;
      const feed = extractGtfsRealtime(
        decodeGtfsRealtimePayload(bytes, response.headers.get('content-type') ?? ''),
        latencyMs,
      );
      this.lastLatencyMs = Math.max(this.lastLatencyMs ?? 0, latencyMs);
      this.lastSuccessfulFetch = this.now().toISOString();

      if (cacheControl.noStore) {
        this.feedCache.delete(kind);
      } else if (cacheControl.maxAgeMs !== null || responseEtag || cacheControl.noCache) {
        this.feedCache.set(kind, {
          feed,
          etag: responseEtag,
          freshUntil: cacheControl.noCache || cacheControl.maxAgeMs === null
            ? nowMs
            : nowMs + cacheControl.maxAgeMs,
        });
      }
      return feed;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GtfsRealtimeFetchError(`Moovit request timed out after ${this.config.requestTimeoutMs} ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async getRoutes() {
    return (await this.getStaticData()).routes;
  }

  async getStops() {
    return (await this.getStaticData()).stops;
  }

  async getVehiclePositions() {
    const [staticData, realtime] = await Promise.all([this.getStaticData(), this.fetchFeed('vehicles')]);
    const now = this.now();
    const vehicles = realtime.vehicles.flatMap((input) => {
      const vehicle = normalizeGtfsVehicle(input, staticData, this.config.staleAfterSeconds, now);
      return vehicle ? [{ ...vehicle, dataSource: 'EXTERNAL' as const, provider: 'MOOVIT' as const }] : [];
    });
    this.vehicleCount = vehicles.length;
    return vehicles;
  }

  async getTripUpdates() {
    const [staticData, realtime] = await Promise.all([this.getStaticData(), this.fetchFeed('trips')]);
    const now = this.now();
    const updates = realtime.tripUpdates.flatMap((input) => {
      const update = normalizeGtfsTripUpdate(input, staticData, now);
      return update ? [{ ...update, dataSource: 'EXTERNAL' as const, provider: 'MOOVIT' as const }] : [];
    });
    this.tripUpdateCount = updates.length;
    return updates;
  }

  async getServiceAlerts() {
    const realtime = await this.fetchFeed('alerts');
    return realtime.alerts.map((input) => ({
      ...normalizeGtfsAlert(input),
      dataSource: 'EXTERNAL' as const,
      provider: 'MOOVIT' as const,
    }));
  }

  getProviderMetadata(): TransitProviderMetadata {
    return {
      provider: 'MOOVIT',
      sourceName: this.config.sourceName,
      sourceTermsUrl: this.config.sourceTermsUrl,
      metroId: this.config.metroId,
      agencyId: this.config.agencyId,
    };
  }

  verifySnapshot(snapshot: TransitProviderSnapshot): TransitProviderVerification {
    this.lastVerification = verifyMoovitBengaluruFeed({ ...snapshot, agencyId: this.config.agencyId });
    return this.lastVerification;
  }

  async getFeedHealth(): Promise<Partial<TransitFeedHealth>> {
    return {
      provider: 'MOOVIT',
      configured: true,
      configurationValid: true,
      sourceName: this.config.sourceName,
      sourceTermsUrl: this.config.sourceTermsUrl,
      metroId: this.config.metroId,
      agencyId: this.config.agencyId,
      verificationStatus: this.lastVerification.status,
      verificationReason: this.lastVerification.reason,
      realFeedVerified: this.lastVerification.status === 'VERIFIED',
      lastSuccessfulFetch: this.lastSuccessfulFetch,
      feedLatencyMs: this.lastLatencyMs,
      vehicleCount: this.vehicleCount,
      tripUpdateCount: this.tripUpdateCount,
    };
  }

  async healthCheck(): Promise<Partial<TransitFeedHealth>> {
    return this.getFeedHealth();
  }
}
