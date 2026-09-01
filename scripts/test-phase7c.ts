import assert from 'node:assert/strict';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import { zipSync, strToU8 } from 'fflate';
import { recommendBestBus } from '../utils/bmtcRecommendationEngine.ts';
import { mapGtfsOccupancy } from '../utils/gtfsOccupancy.ts';
import { isVehicleStale } from '../utils/staleVehicle.ts';
import { rejectDuplicateVehicleUpdates } from '../utils/transitDeduplication.ts';
import { decodeGtfsRealtime, extractGtfsRealtime } from '../services/transit/gtfs/gtfsRealtimeLoader.ts';
import { normalizeGtfsStatic, normalizeGtfsTripUpdate, normalizeGtfsVehicle } from '../services/transit/gtfs/gtfsNormalizer.ts';
import { parseGtfsStaticZip } from '../services/transit/gtfs/gtfsStaticLoader.ts';
import { selectProviderMode } from '../services/transit/providerConfig.ts';
import { ProviderHealthService } from '../services/transit/providerHealthService.ts';
import type { GtfsStaticFiles } from '../types/gtfs.ts';

const now = new Date('2026-08-31T10:00:00.000Z');
const staticFiles: GtfsStaticFiles = {
  stops: [
    { stop_id: 'origin', stop_name: 'Origin', stop_lat: '12.97', stop_lon: '77.57', zone_id: 'Central' },
    { stop_id: 'middle', stop_name: 'Middle', stop_lat: '12.95', stop_lon: '77.55', zone_id: 'West' },
    { stop_id: 'destination', stop_name: 'Destination', stop_lat: '12.93', stop_lon: '77.53', zone_id: 'West' },
  ],
  routes: [{ route_id: 'route-242', route_short_name: '242', route_long_name: 'Origin – Destination' }],
  trips: [{ route_id: 'route-242', service_id: 'daily', trip_id: 'trip-242-out', trip_headsign: 'Destination', direction_id: '0' }],
  stopTimes: [
    { trip_id: 'trip-242-out', stop_id: 'origin', stop_sequence: '1' },
    { trip_id: 'trip-242-out', stop_id: 'middle', stop_sequence: '2' },
    { trip_id: 'trip-242-out', stop_id: 'destination', stop_sequence: '3' },
  ],
  calendar: [],
  calendarDates: [],
  shapes: [],
};

const disabled = selectProviderMode({});
assert.equal(disabled.mode, 'DEMO');
assert.equal(disabled.configurationValid, false);

const incomplete = selectProviderMode({ BMTC_REALTIME_ENABLED: 'true', BMTC_PROVIDER_TYPE: 'GTFS_RT' });
assert.equal(incomplete.mode, 'DEMO');
assert.match(incomplete.reason, /URLs are required/i);

const missingProvenance = selectProviderMode({
  BMTC_REALTIME_ENABLED: 'true',
  BMTC_PROVIDER_TYPE: 'GTFS_RT',
  BMTC_VEHICLE_POSITIONS_URL: 'https://example.test/vehicles.pb',
  BMTC_GTFS_STATIC_URL: 'https://example.test/static.zip',
});
assert.equal(missingProvenance.mode, 'DEMO');
assert.match(missingProvenance.reason, /provenance/i);

const configured = selectProviderMode({
  BMTC_REALTIME_ENABLED: 'true',
  BMTC_PROVIDER_TYPE: 'GTFS_RT',
  BMTC_VEHICLE_POSITIONS_URL: 'https://example.test/vehicles.pb',
  BMTC_GTFS_STATIC_URL: 'https://example.test/static.zip',
  BMTC_FEED_SOURCE_NAME: 'Documented Test Transit Authority',
  BMTC_FEED_TERMS_URL: 'https://example.test/open-data-terms',
});
assert.equal(configured.mode, 'GTFS_RT');
assert.equal(configured.configurationValid, true);
assert.equal(configured.config?.staleAfterSeconds, 120);

const fixtureDecision = selectProviderMode({ BMTC_REALTIME_ENABLED: 'true', BMTC_PROVIDER_TYPE: 'FIXTURE' });
assert.equal(fixtureDecision.mode, 'FIXTURE');

const archive = zipSync({
  'stops.txt': strToU8('stop_id,stop_name,stop_lat,stop_lon\norigin,"Origin, Main",12.97,77.57\ndestination,Destination,12.93,77.53\n'),
  'routes.txt': strToU8('route_id,route_short_name,route_long_name\nroute-242,242,Origin to Destination\n'),
  'trips.txt': strToU8('route_id,service_id,trip_id,direction_id\nroute-242,daily,trip-242-out,0\n'),
  'stop_times.txt': strToU8('trip_id,stop_id,stop_sequence\ntrip-242-out,origin,1\ntrip-242-out,destination,2\n'),
});
assert.equal(parseGtfsStaticZip(archive).stops[0].stop_name, 'Origin, Main');

const normalized = normalizeGtfsStatic(staticFiles, now);
assert.equal(normalized.stops.length, 3);
assert.equal(normalized.routes.length, 1);
assert.equal(normalized.routes[0].routeNumber, '242');
assert.equal(normalized.routes[0].stopIds.length, 3);
assert.equal(normalized.trips[0].direction, 'OUTBOUND');

const FeedMessage = GtfsRealtimeBindings.transit_realtime.FeedMessage;
const protobufBytes = FeedMessage.encode({
  header: { gtfsRealtimeVersion: '2.0', timestamp: Math.floor(now.getTime() / 1000) - 10 },
  entity: [{
    id: 'entity-1',
    vehicle: {
      trip: { tripId: 'trip-242-out', routeId: 'route-242', directionId: 0 },
      vehicle: { id: 'bus-1', label: 'KA-01-TEST' },
      position: { latitude: 12.95, longitude: 77.55, bearing: 180, speed: 8 },
      timestamp: Math.floor(now.getTime() / 1000) - 10,
      stopId: 'middle',
      currentStopSequence: 2,
      currentStatus: 2,
      occupancyStatus: 3,
    },
  }],
}).finish();
const extracted = extractGtfsRealtime(decodeGtfsRealtime(protobufBytes));
assert.equal(extracted.vehicles.length, 1);
assert.equal(extracted.vehicles[0].vehicleId, 'bus-1');

const vehicle = normalizeGtfsVehicle(extracted.vehicles[0], normalized, 120, now);
assert.ok(vehicle);
assert.equal(vehicle.isLive, true);
assert.equal(vehicle.occupancy.crowdLevel, 'HIGH');
assert.equal(vehicle.occupancy.crowdSource, 'LIVE_OCCUPANCY');
assert.equal(vehicle.occupancy.passengerCount, null);
assert.equal(vehicle.nextStopId, normalized.stops[1].stopId);

const staleVehicle = normalizeGtfsVehicle({
  ...extracted.vehicles[0],
  timestampSeconds: Math.floor(now.getTime() / 1000) - 121,
}, normalized, 120, now);
assert.equal(staleVehicle?.isLive, false);
assert.equal(isVehicleStale(new Date(now.getTime() - 121_000).toISOString(), 120, now), true);
assert.equal(isVehicleStale(new Date(now.getTime() + 61_000).toISOString(), 120, now), true);

assert.equal(mapGtfsOccupancy(0, null).crowdLevel, 'LOW');
assert.equal(mapGtfsOccupancy(2, null).crowdLevel, 'MEDIUM');
assert.equal(mapGtfsOccupancy(4, null).crowdLevel, 'VERY_HIGH');
assert.equal(mapGtfsOccupancy(null, null).crowdSource, 'HISTORICAL_PREDICTION');
assert.equal(mapGtfsOccupancy(null, 72).crowdLevel, 'HIGH');

const tripUpdate = normalizeGtfsTripUpdate({
  entityId: 'update-1',
  tripId: 'trip-242-out',
  routeId: 'route-242',
  vehicleId: 'bus-1',
  directionId: 0,
  timestampSeconds: Math.floor(now.getTime() / 1000),
  stopTimeUpdates: [{
    stopId: 'destination',
    stopSequence: 3,
    arrivalTimeSeconds: Math.floor(now.getTime() / 1000) + 600,
    departureTimeSeconds: Math.floor(now.getTime() / 1000) + 660,
    delaySeconds: 120,
  }],
}, normalized, now);
assert.equal(tripUpdate?.stopTimeUpdates[0].etaMinutes, 10);
assert.equal(tripUpdate?.stopTimeUpdates[0].etaSource, 'LIVE_TRIP_UPDATE');

const versions = new Map<string, string>();
assert.equal(rejectDuplicateVehicleUpdates([vehicle], versions).length, 1);
assert.equal(rejectDuplicateVehicleUpdates([vehicle], versions).length, 0);
assert.equal(rejectDuplicateVehicleUpdates([{ ...vehicle, longitude: vehicle.longitude + 0.001 }], versions).length, 1);

const health = new ProviderHealthService();
health.beginRealProvider('GTFS_RT', 'Test authority', 'https://example.test/terms');
assert.equal(health.recordRealSuccess({
  provider: 'GTFS_RT',
  vehicles: [vehicle],
  latencyMs: 45,
  sourceName: 'Test authority',
  sourceTermsUrl: 'https://example.test/terms',
  staleAfterSeconds: 120,
  now,
}).status, 'LIVE');
assert.equal(health.getSnapshot().realFeedVerified, true);
assert.equal(health.recordFailure(new Error('timeout'), 'GTFS_RT', true, true, new Date(now.getTime() + 1_000)).status, 'DEGRADED');
health.recordFailure(new Error('timeout'), 'GTFS_RT', true, true, new Date(now.getTime() + 2_000));
assert.equal(health.recordFailure(new Error('timeout'), 'GTFS_RT', true, true, new Date(now.getTime() + 3_000)).status, 'OFFLINE');
assert.equal(health.recordRealSuccess({
  provider: 'GTFS_RT', vehicles: [vehicle], latencyMs: 30, sourceName: 'Test authority',
  sourceTermsUrl: 'https://example.test/terms', staleAfterSeconds: 120, now,
}).status, 'LIVE');

const staleHealth = new ProviderHealthService();
staleHealth.beginRealProvider('GTFS_RT', 'Test authority', 'https://example.test/terms');
staleHealth.recordRealSuccess({
  provider: 'GTFS_RT', vehicles: [vehicle], latencyMs: 30, sourceName: 'Test authority',
  sourceTermsUrl: 'https://example.test/terms', staleAfterSeconds: 120, now,
});
assert.equal(staleHealth.markStale(120, new Date(now.getTime() + 121_000)).status, 'DEGRADED');
assert.equal(staleHealth.getSnapshot().fallbackActive, true);

const route = normalized.routes[0];
const rush = { rushLevel: 'MODERATE' as const, rushScore: 45, confidence: 70, source: 'MIXED' as const, factors: ['Fixture'] };
const recommendation = recommendBestBus({
  selectedStopId: route.stopIds[0],
  destinationStopId: route.stopIds[2],
  routes: [route],
  rush,
  dataSource: 'BMTC_REALTIME',
  candidates: [{
    vehicleId: vehicle.vehicleId,
    routeId: route.routeId,
    routeNumber: route.routeNumber,
    direction: vehicle.direction,
    currentStopId: vehicle.currentStopId,
    nextStopId: vehicle.nextStopId,
    etaMinutes: 10,
    delayMinutes: 2,
    crowdLevel: vehicle.occupancy.crowdLevel,
    crowdScore: vehicle.occupancy.crowdScore,
    crowdConfidence: vehicle.occupancy.crowdConfidence,
    crowdSource: vehicle.occupancy.crowdSource,
    passengerCount: null,
    dataSource: 'BMTC_REALTIME',
  }],
});
assert.equal(recommendation.recommendedBus?.vehicleId, vehicle.vehicleId);

console.log('Phase 7C provider, GTFS, health, stale, deduplication, ETA, occupancy, and recommendation tests passed.');
