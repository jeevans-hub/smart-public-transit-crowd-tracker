import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { GtfsStaticFiles, GtfsVehicleInput } from '../types/gtfs.ts';
import type { TransitProviderMetadata } from '../types/transit.ts';
import { recommendBestBus } from '../utils/bmtcRecommendationEngine.ts';
import { createMoovitHmacAuthorization, createMoovitNonce } from '../utils/moovitAuth.ts';
import { verifyMoovitBengaluruFeed } from '../utils/moovitVerification.ts';
import { isVehicleStale } from '../utils/staleVehicle.ts';
import { rejectDuplicateVehicleUpdates } from '../utils/transitDeduplication.ts';
import { GtfsRealtimeFetchError } from '../services/transit/gtfs/gtfsRealtimeLoader.ts';
import { normalizeGtfsStatic, normalizeGtfsVehicle } from '../services/transit/gtfs/gtfsNormalizer.ts';
import {
  MoovitTransitProvider,
  parseMoovitCacheControl,
  type MoovitTransitProviderConfig,
} from '../services/transit/moovitTransitProvider.ts';
import { selectProviderMode } from '../services/transit/providerConfig.ts';
import { ProviderHealthService } from '../services/transit/providerHealthService.ts';

interface MoovitFixture {
  agencyId: string;
  static: GtfsStaticFiles;
  freshVehicle: Omit<GtfsVehicleInput, 'timestampSeconds'> & { timestampAgeSeconds: number };
  wrongRegionVehicle: { latitude: number; longitude: number };
  tripUpdate: {
    entityId: string;
    tripId: string;
    routeId: string;
    vehicleId: string;
    directionId: number;
    timestampAgeSeconds: number;
    arrivalInSeconds: number;
    delaySeconds: number;
  };
}

const fixture = JSON.parse(readFileSync(new URL('../fixtures/moovit/scenarios.json', import.meta.url), 'utf8')) as MoovitFixture;
const now = new Date('2026-09-01T10:00:00.000Z');
const nowSeconds = Math.floor(now.getTime() / 1000);
const staticData = normalizeGtfsStatic(fixture.static, now);
const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;

function responseBody(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

const vehicleBytes = FeedMessage.encode({
  header: { gtfsRealtimeVersion: '2.0', timestamp: nowSeconds - fixture.freshVehicle.timestampAgeSeconds },
  entity: [{
    id: fixture.freshVehicle.entityId,
    vehicle: {
      trip: {
        tripId: fixture.freshVehicle.tripId,
        routeId: fixture.freshVehicle.routeId,
        directionId: fixture.freshVehicle.directionId,
      },
      vehicle: { id: fixture.freshVehicle.vehicleId, label: fixture.freshVehicle.vehicleLabel },
      position: {
        latitude: fixture.freshVehicle.latitude ?? 0,
        longitude: fixture.freshVehicle.longitude ?? 0,
        bearing: fixture.freshVehicle.bearing,
        speed: fixture.freshVehicle.speedMetersPerSecond,
      },
      timestamp: nowSeconds - fixture.freshVehicle.timestampAgeSeconds,
      stopId: fixture.freshVehicle.stopId,
      currentStopSequence: fixture.freshVehicle.currentStopSequence,
      currentStatus: fixture.freshVehicle.currentStatus,
      occupancyStatus: fixture.freshVehicle.occupancyStatus,
    },
  }],
}).finish();

const tripBytes = FeedMessage.encode({
  header: { gtfsRealtimeVersion: '2.0', timestamp: nowSeconds - fixture.tripUpdate.timestampAgeSeconds },
  entity: [{
    id: fixture.tripUpdate.entityId,
    tripUpdate: {
      trip: {
        tripId: fixture.tripUpdate.tripId,
        routeId: fixture.tripUpdate.routeId,
        directionId: fixture.tripUpdate.directionId,
      },
      vehicle: { id: fixture.tripUpdate.vehicleId },
      timestamp: nowSeconds - fixture.tripUpdate.timestampAgeSeconds,
      stopTimeUpdate: [{
        stopId: 'moovit-destination',
        stopSequence: 3,
        arrival: {
          time: nowSeconds + fixture.tripUpdate.arrivalInSeconds,
          delay: fixture.tripUpdate.delaySeconds,
        },
      }],
    },
  }],
}).finish();

const alertBytes = FeedMessage.encode({
  header: { gtfsRealtimeVersion: '2.0', timestamp: nowSeconds },
  entity: [{
    id: 'moovit-service-alert',
    alert: {
      activePeriod: [{ start: nowSeconds - 60, end: nowSeconds + 3_600 }],
      informedEntity: [{ agencyId: fixture.agencyId, routeId: 'moovit-route-242a', stopId: 'moovit-middle' }],
      effect: 1,
      headerText: { translation: [{ text: 'Fixture diversion', language: 'en' }] },
      descriptionText: { translation: [{ text: 'Use the temporary stop.', language: 'en' }] },
    },
  }],
}).finish();

const baseEnvironment = {
  BMTC_REALTIME_ENABLED: 'true',
  BMTC_PROVIDER_TYPE: 'MOOVIT',
  MOOVIT_ENABLED: 'true',
  MOOVIT_API_BASE_URL: 'https://api.example.test/services/EX/API',
  MOOVIT_API_KEY: 'fixture-public-key',
  MOOVIT_METRO_ID: '999',
  MOOVIT_AGENCY_ID: fixture.agencyId,
  MOOVIT_TRANSIT_TYPE: 'BUS',
  MOOVIT_GTFS_STATIC_URL: 'https://static.example.test/bengaluru.zip',
};

const missingKey = selectProviderMode({ ...baseEnvironment, MOOVIT_API_KEY: '' });
assert.equal(missingKey.mode, 'DEMO');
assert.equal(missingKey.requestedProvider, 'MOOVIT');
assert.match(missingKey.reason, /API_KEY is required/i);

const missingMetro = selectProviderMode({ ...baseEnvironment, MOOVIT_METRO_ID: '' });
assert.equal(missingMetro.mode, 'DEMO');
assert.match(missingMetro.reason, /METRO_ID is required/i);

const disabledMoovit = selectProviderMode({ ...baseEnvironment, MOOVIT_ENABLED: 'false' });
assert.equal(disabledMoovit.mode, 'DEMO');
assert.match(disabledMoovit.reason, /disabled/i);

const missingHmacSecret = selectProviderMode({
  ...baseEnvironment,
  MOOVIT_AUTH_MODE: 'HMAC',
  MOOVIT_API_SECRET: '',
});
assert.equal(missingHmacSecret.mode, 'DEMO');
assert.match(missingHmacSecret.reason, /API_SECRET is required/i);

const configured = selectProviderMode(baseEnvironment);
assert.equal(configured.mode, 'MOOVIT');
assert.equal(configured.configurationValid, true);
assert.equal(configured.config?.providerType, 'MOOVIT');
if (configured.config?.providerType !== 'MOOVIT') throw new Error('Moovit fixture configuration was not selected');
assert.equal(configured.config.metroId, '999');
assert.equal(configured.config.transitType, 'BUS');

const hmac = createMoovitHmacAuthorization({
  secret: 'fixture-secret',
  payload: 'fixture-payload',
  timestamp: 1_234_567_890,
  nonce: 'qwerty',
});
assert.equal(hmac.signature, '608cc571e5d0aacd6003d89cf875980d744840a27e0bb52d3c646e4332c17e42');
assert.equal(hmac.authorization, `hmacauth ${hmac.signature}:qwerty:1234567890`);
assert.equal(createMoovitNonce().length, 255);

assert.deepEqual(parseMoovitCacheControl('public, max-age=60'), { noStore: false, noCache: false, maxAgeMs: 60_000 });
assert.deepEqual(parseMoovitCacheControl('no-store, no-cache'), { noStore: true, noCache: true, maxAgeMs: null });

const config: MoovitTransitProviderConfig = configured.config;
const requests: Array<{ url: URL; headers: Headers }> = [];
const documentedFetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  const headers = new Headers(init?.headers);
  requests.push({ url, headers });
  const bytes = url.pathname.endsWith('/SaRtGtfs')
    ? alertBytes
    : url.searchParams.get('vehiclePositions') === '1' ? vehicleBytes : tripBytes;
  return new Response(responseBody(bytes), {
    status: 200,
    headers: {
      'content-type': 'application/x-protobuf',
      'cache-control': 'no-cache',
      etag: '"phase7d-fixture"',
    },
  });
}) as typeof fetch;

const provider = new MoovitTransitProvider(config, {
  fetchImpl: documentedFetch,
  now: () => now,
  staticData,
});
const [routes, vehicles, tripUpdates, alerts] = await Promise.all([
  provider.getRoutes(),
  provider.getVehiclePositions(),
  provider.getTripUpdates(),
  provider.getServiceAlerts(),
]);
assert.equal(requests.length, 3);
assert.equal(requests.some((request) => request.url.pathname.endsWith('/RtGtfs') && request.url.searchParams.get('vehiclePositions') === '1'), true);
assert.equal(requests.some((request) => request.url.pathname.endsWith('/RtGtfs') && !request.url.searchParams.has('vehiclePositions')), true);
assert.equal(requests.some((request) => request.url.pathname.endsWith('/SaRtGtfs')), true);
assert.equal(requests.every((request) => request.url.searchParams.get('metroId') === '999'), true);
assert.equal(requests.every((request) => request.url.searchParams.get('agencyId') === fixture.agencyId), true);
assert.equal(requests.every((request) => request.url.searchParams.get('transitType') === 'BUS'), true);
assert.equal(requests.every((request) => request.headers.get('API_KEY') === 'fixture-public-key'), true);
assert.equal(requests.every((request) => request.headers.get('Authorization') === null), true);

assert.equal(routes[0].agencyId, fixture.agencyId);
assert.match(routes[0].agencyName ?? '', /BMTC/i);
assert.equal(vehicles.length, 1);
assert.equal(vehicles[0].provider, 'MOOVIT');
assert.equal(vehicles[0].dataSource, 'EXTERNAL');
assert.equal(vehicles[0].isLive, true);
assert.equal(vehicles[0].occupancy.crowdLevel, 'HIGH');
assert.equal(vehicles[0].occupancy.crowdSource, 'LIVE_OCCUPANCY');
assert.equal(vehicles[0].occupancy.passengerCount, null);
assert.equal(tripUpdates.length, 1);
assert.equal(tripUpdates[0].provider, 'MOOVIT');
assert.equal(tripUpdates[0].stopTimeUpdates[0].etaMinutes, 10);
assert.equal(tripUpdates[0].stopTimeUpdates[0].etaSource, 'LIVE_TRIP_UPDATE');
assert.equal(alerts.length, 1);
assert.equal(alerts[0].provider, 'MOOVIT');
assert.equal(alerts[0].agencyIds?.[0], fixture.agencyId);
assert.equal(alerts[0].title, 'Fixture diversion');

const verified = provider.verifySnapshot({ routes, vehicles, tripUpdates });
assert.equal(verified.status, 'VERIFIED');
assert.equal(verified.bengaluruPlausible, true);

const unverified = verifyMoovitBengaluruFeed({ routes, vehicles, tripUpdates, agencyId: null });
assert.equal(unverified.status, 'UNVERIFIED');
assert.match(unverified.reason, /agency ID/i);

const wrongRegion = verifyMoovitBengaluruFeed({
  routes,
  tripUpdates,
  agencyId: fixture.agencyId,
  vehicles: [{ ...vehicles[0], ...fixture.wrongRegionVehicle }],
});
assert.equal(wrongRegion.status, 'FAILED');
assert.match(wrongRegion.reason, /outside/i);

const rawVehicle: GtfsVehicleInput = {
  ...fixture.freshVehicle,
  timestampSeconds: nowSeconds - 121,
};
const stale = normalizeGtfsVehicle(rawVehicle, staticData, 120, now);
assert.equal(stale?.isLive, false);
const future = normalizeGtfsVehicle({ ...rawVehicle, timestampSeconds: nowSeconds + 61 }, staticData, 120, now);
assert.equal(future?.isLive, false);
assert.equal(isVehicleStale(new Date((nowSeconds + 61) * 1000).toISOString(), 120, now), true);

const versions = new Map<string, string>();
assert.equal(rejectDuplicateVehicleUpdates(vehicles, versions).length, 1);
assert.equal(rejectDuplicateVehicleUpdates(vehicles, versions).length, 0);

const metadata: TransitProviderMetadata = provider.getProviderMetadata();
const health = new ProviderHealthService();
health.beginRealProvider('MOOVIT', metadata.sourceName, metadata.sourceTermsUrl, metadata);
assert.equal(health.recordRealSuccess({
  provider: 'MOOVIT',
  vehicles,
  tripUpdateCount: tripUpdates.length,
  latencyMs: 42,
  sourceName: metadata.sourceName,
  sourceTermsUrl: metadata.sourceTermsUrl,
  staleAfterSeconds: 120,
  verification: verified,
  metadata,
  now,
}).status, 'LIVE');
assert.equal(health.getSnapshot().verificationStatus, 'VERIFIED');
assert.equal(health.getSnapshot().tripUpdateCount, 1);
assert.equal(health.recordFailure(new Error('HTTP 401'), 'MOOVIT', true, true, new Date(now.getTime() + 1_000)).status, 'DEGRADED');
assert.equal(health.recordRealSuccess({
  provider: 'MOOVIT', vehicles, tripUpdateCount: 1, latencyMs: 20,
  sourceName: metadata.sourceName, sourceTermsUrl: metadata.sourceTermsUrl,
  staleAfterSeconds: 120, verification: verified, metadata, now,
}).status, 'LIVE');

const unverifiedHealth = new ProviderHealthService();
unverifiedHealth.beginRealProvider('MOOVIT', metadata.sourceName, metadata.sourceTermsUrl, metadata);
const unverifiedStatus = unverifiedHealth.recordRealSuccess({
  provider: 'MOOVIT', vehicles, tripUpdateCount: 1, latencyMs: 20,
  sourceName: metadata.sourceName, sourceTermsUrl: metadata.sourceTermsUrl,
  staleAfterSeconds: 120, verification: unverified, metadata, now,
});
assert.equal(unverifiedStatus.status, 'DEGRADED');
assert.equal(unverifiedStatus.fallbackActive, false);
assert.equal(unverifiedStatus.realFeedVerified, false);

function statusFetch(status: number, headers: Record<string, string> = {}): typeof fetch {
  return (async () => new Response(null, { status, headers })) as typeof fetch;
}

for (const status of [401, 403]) {
  const failingProvider = new MoovitTransitProvider(config, {
    staticData,
    now: () => now,
    fetchImpl: statusFetch(status),
  });
  await assert.rejects(
    failingProvider.getVehiclePositions(),
    (error: unknown) => error instanceof GtfsRealtimeFetchError && error.status === status,
  );
}

const rateLimitedProvider = new MoovitTransitProvider(config, {
  staticData,
  now: () => now,
  fetchImpl: statusFetch(429, { 'retry-after': '60' }),
});
await assert.rejects(
  rateLimitedProvider.getVehiclePositions(),
  (error: unknown) => error instanceof GtfsRealtimeFetchError && error.status === 429 && error.retryAfterMs === 60_000,
);

const timeoutProvider = new MoovitTransitProvider({ ...config, requestTimeoutMs: 10 }, {
  staticData,
  now: () => now,
  fetchImpl: ((_: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
  })) as typeof fetch,
});
await assert.rejects(timeoutProvider.getVehiclePositions(), /timed out/i);

let cacheFetchCount = 0;
const cacheProvider = new MoovitTransitProvider(config, {
  staticData,
  now: () => now,
  fetchImpl: (async () => {
    cacheFetchCount += 1;
    return new Response(responseBody(vehicleBytes), {
      status: 200,
      headers: { 'content-type': 'application/x-protobuf', 'cache-control': 'max-age=60' },
    });
  }) as typeof fetch,
});
await cacheProvider.getVehiclePositions();
await cacheProvider.getVehiclePositions();
assert.equal(cacheFetchCount, 1, 'Moovit max-age must prevent an unnecessary upstream request');

let hmacHeader = '';
const hmacProvider = new MoovitTransitProvider({
  ...config,
  authMode: 'HMAC',
  apiSecret: 'fixture-secret',
}, {
  staticData,
  now: () => now,
  nonceFactory: () => 'fixture-nonce',
  fetchImpl: (async (_input: RequestInfo | URL, init?: RequestInit) => {
    hmacHeader = new Headers(init?.headers).get('Authorization') ?? '';
    return new Response(responseBody(vehicleBytes), { status: 200, headers: { 'content-type': 'application/x-protobuf' } });
  }) as typeof fetch,
});
await hmacProvider.getVehiclePositions();
assert.match(hmacHeader, /^hmacauth [a-f0-9]{64}:fixture-nonce:\d+$/);
assert.equal(hmacHeader.includes('fixture-secret'), false);

const recommendation = recommendBestBus({
  selectedStopId: routes[0].stopIds[0],
  destinationStopId: routes[0].stopIds.at(-1) as string,
  routes,
  dataSource: 'EXTERNAL',
  rush: {
    rushLevel: 'MODERATE', rushScore: 45, confidence: 70, source: 'MIXED', factors: ['Moovit fixture'],
  },
  candidates: [{
    vehicleId: vehicles[0].vehicleId,
    routeId: vehicles[0].routeId,
    routeNumber: routes[0].routeNumber,
    direction: vehicles[0].direction,
    currentStopId: vehicles[0].currentStopId,
    nextStopId: vehicles[0].nextStopId,
    etaMinutes: tripUpdates[0].stopTimeUpdates[0].etaMinutes ?? 10,
    delayMinutes: 2,
    crowdLevel: vehicles[0].occupancy.crowdLevel,
    crowdScore: vehicles[0].occupancy.crowdScore,
    crowdConfidence: vehicles[0].occupancy.crowdConfidence,
    crowdSource: vehicles[0].occupancy.crowdSource,
    passengerCount: null,
    dataSource: 'EXTERNAL',
  }],
});
assert.equal(recommendation.recommendedBus?.vehicleId, vehicles[0].vehicleId);

const fallback = selectProviderMode({ ...baseEnvironment, MOOVIT_API_KEY: '' });
assert.equal(fallback.mode, 'DEMO');
assert.equal(fallback.requestedProvider, 'MOOVIT');

console.log('Phase 7D Moovit config, auth, GTFS-Realtime, verification, cache, errors, health, occupancy, ETA, dedupe, recommendation, and fallback tests passed.');
