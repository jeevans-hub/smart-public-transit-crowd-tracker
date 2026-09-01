import GtfsRealtimeBindings from 'gtfs-realtime-bindings';
import type { transit_realtime } from 'gtfs-realtime-bindings';
import type {
  GtfsAlertInput,
  GtfsTripUpdateInput,
  GtfsVehicleInput,
} from '../../../types/gtfs';

type ProtobufNumber = number | { toNumber(): number } | null | undefined;

export interface GtfsRealtimeLoadOptions {
  timeoutMs?: number;
  headers?: Record<string, string>;
}

export interface LoadedGtfsRealtimeFeed {
  vehicles: GtfsVehicleInput[];
  tripUpdates: GtfsTripUpdateInput[];
  alerts: GtfsAlertInput[];
  feedTimestampSeconds: number | null;
  latencyMs: number;
}

export class GtfsRealtimeFetchError extends Error {
  readonly status: number | null;
  readonly retryAfterMs: number | null;

  constructor(
    message: string,
    status: number | null = null,
    retryAfter: number | null = null,
  ) {
    super(message);
    this.name = 'GtfsRealtimeFetchError';
    this.status = status;
    this.retryAfterMs = retryAfter;
  }
}

function numberValue(value: ProtobufNumber): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (value && typeof value.toNumber === 'function') {
    const result = value.toNumber();
    return Number.isFinite(result) ? result : null;
  }
  return null;
}

function hasOwn(value: object | null | undefined, key: string): boolean {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(value, key);
}

function retryAfterMs(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null;
}

function translatedText(value: transit_realtime.ITranslatedString | null | undefined): string {
  if (!value?.translation?.length) return '';
  return value.translation.find((translation) => translation.language?.toLowerCase().startsWith('en'))?.text
    || value.translation[0]?.text
    || '';
}

function extractVehicle(entity: transit_realtime.IFeedEntity, feedTimestamp: number | null): GtfsVehicleInput | null {
  const vehicle = entity.vehicle;
  if (!vehicle) return null;
  return {
    entityId: entity.id,
    vehicleId: vehicle.vehicle?.id || null,
    vehicleLabel: vehicle.vehicle?.label || null,
    tripId: vehicle.trip?.tripId || null,
    routeId: vehicle.trip?.routeId || null,
    directionId: hasOwn(vehicle.trip, 'directionId') ? vehicle.trip?.directionId ?? null : null,
    latitude: hasOwn(vehicle.position, 'latitude') ? vehicle.position?.latitude ?? null : null,
    longitude: hasOwn(vehicle.position, 'longitude') ? vehicle.position?.longitude ?? null : null,
    bearing: hasOwn(vehicle.position, 'bearing') ? vehicle.position?.bearing ?? null : null,
    speedMetersPerSecond: hasOwn(vehicle.position, 'speed') ? vehicle.position?.speed ?? null : null,
    timestampSeconds: (hasOwn(vehicle, 'timestamp') ? numberValue(vehicle.timestamp) : null) ?? feedTimestamp,
    stopId: vehicle.stopId || null,
    currentStopSequence: hasOwn(vehicle, 'currentStopSequence') ? vehicle.currentStopSequence ?? null : null,
    currentStatus: hasOwn(vehicle, 'currentStatus') ? vehicle.currentStatus ?? null : null,
    occupancyStatus: hasOwn(vehicle, 'occupancyStatus') ? vehicle.occupancyStatus ?? null : null,
    occupancyPercentage: hasOwn(vehicle, 'occupancyPercentage') ? vehicle.occupancyPercentage ?? null : null,
  };
}

function extractTripUpdate(entity: transit_realtime.IFeedEntity, feedTimestamp: number | null): GtfsTripUpdateInput | null {
  const update = entity.tripUpdate;
  if (!update) return null;
  return {
    entityId: entity.id,
    tripId: update.trip.tripId || null,
    routeId: update.trip.routeId || null,
    directionId: hasOwn(update.trip, 'directionId') ? update.trip.directionId ?? null : null,
    vehicleId: update.vehicle?.id || null,
    timestampSeconds: (hasOwn(update, 'timestamp') ? numberValue(update.timestamp) : null) ?? feedTimestamp,
    stopTimeUpdates: (update.stopTimeUpdate ?? []).map((stop) => ({
      stopId: stop.stopId || null,
      stopSequence: hasOwn(stop, 'stopSequence') ? stop.stopSequence ?? null : null,
      arrivalTimeSeconds: hasOwn(stop.arrival, 'time') ? numberValue(stop.arrival?.time) : null,
      departureTimeSeconds: hasOwn(stop.departure, 'time') ? numberValue(stop.departure?.time) : null,
      delaySeconds: hasOwn(stop.arrival, 'delay')
        ? stop.arrival?.delay ?? null
        : hasOwn(stop.departure, 'delay')
          ? stop.departure?.delay ?? null
          : hasOwn(update, 'delay') ? update.delay ?? null : null,
    })),
  };
}

function extractAlert(entity: transit_realtime.IFeedEntity): GtfsAlertInput | null {
  const alert = entity.alert;
  if (!alert) return null;
  const starts = (alert.activePeriod ?? []).map((period) => numberValue(period.start)).filter((value): value is number => value !== null);
  const ends = (alert.activePeriod ?? []).map((period) => numberValue(period.end)).filter((value): value is number => value !== null);
  return {
    entityId: entity.id,
    title: translatedText(alert.headerText),
    description: translatedText(alert.descriptionText),
    rawRouteIds: [...new Set((alert.informedEntity ?? []).map((item) => item.routeId).filter((value): value is string => Boolean(value)))],
    rawStopIds: [...new Set((alert.informedEntity ?? []).map((item) => item.stopId).filter((value): value is string => Boolean(value)))],
    agencyIds: [...new Set((alert.informedEntity ?? []).map((item) => item.agencyId).filter((value): value is string => Boolean(value)))],
    effect: hasOwn(alert, 'effect') ? String(alert.effect) : null,
    activeFromSeconds: starts.length ? Math.min(...starts) : null,
    activeUntilSeconds: ends.length ? Math.max(...ends) : null,
  };
}

export function decodeGtfsRealtime(bytes: Uint8Array): transit_realtime.FeedMessage {
  try {
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(bytes);
  } catch (error) {
    throw new GtfsRealtimeFetchError(`Invalid GTFS-Realtime protobuf: ${error instanceof Error ? error.message : 'decode failed'}`);
  }
}

export function decodeGtfsRealtimePayload(
  bytes: Uint8Array,
  contentType = '',
): transit_realtime.FeedMessage {
  const looksJson = contentType.toLowerCase().includes('json')
    || new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 32))).trimStart().startsWith('{');
  if (!looksJson) return decodeGtfsRealtime(bytes);
  try {
    const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('JSON response is not a GTFS-Realtime feed object');
    }
    return GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject(
      value as Parameters<typeof GtfsRealtimeBindings.transit_realtime.FeedMessage.fromObject>[0],
    );
  } catch (error) {
    throw new GtfsRealtimeFetchError(`Invalid GTFS-Realtime JSON: ${error instanceof Error ? error.message : 'decode failed'}`);
  }
}

export function extractGtfsRealtime(
  feed: transit_realtime.FeedMessage,
  latencyMs = 0,
): LoadedGtfsRealtimeFeed {
  const feedTimestampSeconds = hasOwn(feed.header, 'timestamp') ? numberValue(feed.header.timestamp) : null;
  return {
    vehicles: feed.entity.map((entity) => extractVehicle(entity, feedTimestampSeconds)).filter((value): value is GtfsVehicleInput => value !== null),
    tripUpdates: feed.entity.map((entity) => extractTripUpdate(entity, feedTimestampSeconds)).filter((value): value is GtfsTripUpdateInput => value !== null),
    alerts: feed.entity.map(extractAlert).filter((value): value is GtfsAlertInput => value !== null),
    feedTimestampSeconds,
    latencyMs,
  };
}

export async function loadGtfsRealtime(
  url: string,
  options: GtfsRealtimeLoadOptions = {},
): Promise<LoadedGtfsRealtimeFeed> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new GtfsRealtimeFetchError('GTFS-Realtime URL must use HTTP or HTTPS');
  }
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10_000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();
  try {
    const response = await fetch(parsed, {
      cache: 'no-store',
      headers: options.headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new GtfsRealtimeFetchError(
        `GTFS-Realtime request failed with HTTP ${response.status}`,
        response.status,
        retryAfterMs(response.headers.get('retry-after')),
      );
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength === 0) throw new GtfsRealtimeFetchError('GTFS-Realtime feed is empty');
    return extractGtfsRealtime(decodeGtfsRealtime(bytes), Date.now() - startedAt);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GtfsRealtimeFetchError(`GTFS-Realtime request timed out after ${timeoutMs} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
