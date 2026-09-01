import type {
  GtfsAlertInput,
  GtfsStaticFiles,
  GtfsTripUpdateInput,
  GtfsVehicleInput,
  NormalizedGtfsStatic,
  NormalizedGtfsTrip,
} from '../../../types/gtfs';
import type { TransitRoute, TransitServiceAlert, TransitStop, TransitTripUpdate, TransitVehicle } from '../../../types/transit';
import { mapGtfsOccupancy } from '../../../utils/gtfsOccupancy.ts';
import { normalizeGtfsRouteId, normalizeGtfsStopId, normalizeGtfsVehicleId } from '../../../utils/gtfsRouteMatcher.ts';
import { directionFromGtfs, normalizeGtfsTripId } from '../../../utils/gtfsTripMatcher.ts';
import { isVehicleStale } from '../../../utils/staleVehicle.ts';

function finiteNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : null;
}

function isoFromSeconds(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  const date = new Date(value * 1000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export function normalizeGtfsStatic(files: GtfsStaticFiles, now = new Date()): NormalizedGtfsStatic {
  const agencies = files.agency ?? [];
  const agencyById = new Map(agencies.map((row) => [row.agency_id, row]));
  const soleAgency = agencies.length === 1 ? agencies[0] : undefined;
  const rawStopMap = new Map(files.stops.map((row) => [row.stop_id, row]));
  const rawRouteMap = new Map(files.routes.map((row) => [row.route_id, row]));
  const stopTimesByTrip = new Map<string, typeof files.stopTimes>();
  for (const stopTime of files.stopTimes) {
    if (!stopTime.trip_id || !stopTime.stop_id) continue;
    const entries = stopTimesByTrip.get(stopTime.trip_id) ?? [];
    entries.push(stopTime);
    stopTimesByTrip.set(stopTime.trip_id, entries);
  }

  const trips: NormalizedGtfsTrip[] = files.trips.flatMap((row) => {
    if (!row.trip_id || !row.route_id || !rawRouteMap.has(row.route_id)) return [];
    const orderedStops = [...(stopTimesByTrip.get(row.trip_id) ?? [])]
      .sort((left, right) => (finiteNumber(left.stop_sequence) ?? 0) - (finiteNumber(right.stop_sequence) ?? 0))
      .filter((stopTime) => rawStopMap.has(stopTime.stop_id));
    if (orderedStops.length === 0) return [];
    return [{
      tripId: normalizeGtfsTripId(row.trip_id),
      rawTripId: row.trip_id,
      routeId: normalizeGtfsRouteId(row.route_id),
      rawRouteId: row.route_id,
      serviceId: row.service_id || '',
      direction: directionFromGtfs(finiteNumber(row.direction_id)),
      headsign: row.trip_headsign || '',
      shapeId: row.shape_id || null,
      stopIds: orderedStops.map((stopTime) => normalizeGtfsStopId(stopTime.stop_id)),
      rawStopIds: orderedStops.map((stopTime) => stopTime.stop_id),
    }];
  });

  const routeNumbersByStop = new Map<string, Set<string>>();
  for (const trip of trips) {
    const routeRow = rawRouteMap.get(trip.rawRouteId);
    const routeNumber = routeRow?.route_short_name || routeRow?.route_long_name || trip.rawRouteId;
    for (const rawStopId of trip.rawStopIds) {
      const routeNumbers = routeNumbersByStop.get(rawStopId) ?? new Set<string>();
      routeNumbers.add(routeNumber);
      routeNumbersByStop.set(rawStopId, routeNumbers);
    }
  }

  const stops: TransitStop[] = files.stops.flatMap((row) => {
    const latitude = finiteNumber(row.stop_lat);
    const longitude = finiteNumber(row.stop_lon);
    if (!row.stop_id || !row.stop_name || latitude === null || longitude === null) return [];
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return [];
    return [{
      stopId: normalizeGtfsStopId(row.stop_id),
      name: row.stop_name,
      latitude,
      longitude,
      area: row.stop_desc || row.zone_id || row.stop_name,
      routes: [...(routeNumbersByStop.get(row.stop_id) ?? [])],
      source: 'GTFS_STATIC',
      lastUpdated: now.toISOString(),
    }];
  });
  const stopMap = new Map(stops.map((stop) => [stop.stopId, stop]));

  const routes: TransitRoute[] = files.routes.flatMap((row) => {
    if (!row.route_id) return [];
    const candidates = trips.filter((trip) => trip.rawRouteId === row.route_id);
    const representative = candidates.sort((left, right) => {
      if (left.direction !== right.direction) return left.direction === 'OUTBOUND' ? -1 : 1;
      return right.stopIds.length - left.stopIds.length;
    })[0];
    if (!representative) return [];
    const canonicalStopIds = representative.direction === 'INBOUND'
      ? [...representative.stopIds].reverse()
      : representative.stopIds;
    const origin = stopMap.get(canonicalStopIds[0])?.name || representative.headsign || 'Unknown origin';
    const destination = stopMap.get(canonicalStopIds.at(-1) || '')?.name || representative.headsign || 'Unknown destination';
    const shortName = row.route_short_name || row.route_long_name || row.route_id;
    const agency = (row.agency_id ? agencyById.get(row.agency_id) : undefined) ?? soleAgency;
    return [{
      routeId: normalizeGtfsRouteId(row.route_id),
      routeNumber: shortName,
      shortName,
      longName: row.route_long_name || `${origin} – ${destination}`,
      origin,
      destination,
      stopIds: canonicalStopIds,
      source: 'GTFS_STATIC',
      agencyId: row.agency_id || agency?.agency_id || null,
      agencyName: agency?.agency_name || null,
    }];
  });

  return {
    stops,
    routes,
    trips,
    calendar: files.calendar,
    calendarDates: files.calendarDates,
    shapes: files.shapes,
  };
}

function tripForInput(staticData: NormalizedGtfsStatic, rawTripId: string | null): NormalizedGtfsTrip | undefined {
  return rawTripId ? staticData.trips.find((trip) => trip.rawTripId === rawTripId) : undefined;
}

export function normalizeGtfsVehicle(
  input: GtfsVehicleInput,
  staticData: NormalizedGtfsStatic,
  staleAfterSeconds: number,
  now = new Date(),
): TransitVehicle | null {
  const latitude = finiteNumber(input.latitude);
  const longitude = finiteNumber(input.longitude);
  const timestamp = isoFromSeconds(input.timestampSeconds);
  if (latitude === null || longitude === null || timestamp === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const trip = tripForInput(staticData, input.tripId);
  const rawVehicleId = input.vehicleId || input.entityId;
  const rawRouteId = input.routeId || trip?.rawRouteId;
  const rawTripId = input.tripId || trip?.rawTripId;
  if (!rawVehicleId || !rawRouteId || !rawTripId) return null;

  const rawStopId = input.stopId;
  const stopIndex = rawStopId && trip ? trip.rawStopIds.indexOf(rawStopId) : -1;
  const sequenceIndex = input.currentStopSequence === null ? -1 : Math.max(0, input.currentStopSequence - 1);
  const effectiveIndex = stopIndex >= 0 ? stopIndex : sequenceIndex;
  const isStoppedAt = input.currentStatus === 1;
  const currentRawStopId = isStoppedAt
    ? rawStopId
    : effectiveIndex > 0 ? trip?.rawStopIds[effectiveIndex - 1] ?? null : null;
  const nextRawStopId = isStoppedAt
    ? trip?.rawStopIds[effectiveIndex + 1] ?? null
    : rawStopId || trip?.rawStopIds[effectiveIndex] || null;
  const occupancy = mapGtfsOccupancy(input.occupancyStatus, input.occupancyPercentage);

  return {
    vehicleId: normalizeGtfsVehicleId(rawVehicleId),
    registrationNumber: input.vehicleLabel,
    routeId: normalizeGtfsRouteId(rawRouteId),
    tripId: normalizeGtfsTripId(rawTripId),
    direction: trip?.direction || directionFromGtfs(input.directionId),
    latitude,
    longitude,
    bearing: Math.max(0, Math.min(360, finiteNumber(input.bearing) ?? 0)),
    speed: input.speedMetersPerSecond === null ? null : Math.max(0, Math.round(input.speedMetersPerSecond * 3.6 * 10) / 10),
    currentStopId: currentRawStopId ? normalizeGtfsStopId(currentRawStopId) : null,
    nextStopId: nextRawStopId ? normalizeGtfsStopId(nextRawStopId) : null,
    timestamp,
    occupancy: {
      crowdLevel: occupancy.crowdLevel,
      crowdScore: occupancy.crowdScore,
      crowdConfidence: occupancy.crowdConfidence,
      crowdSource: occupancy.crowdSource,
      passengerCount: null,
    },
    rawOccupancyStatus: occupancy.rawOccupancyStatus,
    dataSource: 'BMTC_REALTIME',
    isLive: !isVehicleStale(timestamp, staleAfterSeconds, now),
  };
}

export function normalizeGtfsTripUpdate(
  input: GtfsTripUpdateInput,
  staticData: NormalizedGtfsStatic,
  now = new Date(),
): TransitTripUpdate | null {
  const trip = tripForInput(staticData, input.tripId);
  const rawTripId = input.tripId || trip?.rawTripId;
  const rawRouteId = input.routeId || trip?.rawRouteId;
  if (!rawTripId || !rawRouteId) return null;
  const timestamp = isoFromSeconds(input.timestampSeconds) || now.toISOString();
  return {
    tripId: normalizeGtfsTripId(rawTripId),
    routeId: normalizeGtfsRouteId(rawRouteId),
    vehicleId: input.vehicleId ? normalizeGtfsVehicleId(input.vehicleId) : null,
    timestamp,
    stopTimeUpdates: input.stopTimeUpdates.flatMap((stopUpdate) => {
      const rawStopId = stopUpdate.stopId
        || (stopUpdate.stopSequence === null ? null : trip?.rawStopIds[Math.max(0, stopUpdate.stopSequence - 1)]);
      if (!rawStopId) return [];
      const arrivalTime = isoFromSeconds(stopUpdate.arrivalTimeSeconds);
      const departureTime = isoFromSeconds(stopUpdate.departureTimeSeconds);
      const eventTime = stopUpdate.arrivalTimeSeconds ?? stopUpdate.departureTimeSeconds;
      return [{
        stopId: normalizeGtfsStopId(rawStopId),
        arrivalTime,
        departureTime,
        delaySeconds: stopUpdate.delaySeconds,
        etaMinutes: eventTime === null ? null : Math.max(0, Math.ceil((eventTime * 1000 - now.getTime()) / 60_000)),
        etaSource: eventTime === null ? 'SCHEDULED' as const : 'LIVE_TRIP_UPDATE' as const,
      }];
    }),
    dataSource: 'BMTC_REALTIME',
  };
}

export function normalizeGtfsAlert(input: GtfsAlertInput): TransitServiceAlert {
  return {
    alertId: input.entityId,
    title: input.title || 'Transit service alert',
    description: input.description,
    routeIds: input.rawRouteIds.map(normalizeGtfsRouteId),
    stopIds: input.rawStopIds.map(normalizeGtfsStopId),
    activeFrom: isoFromSeconds(input.activeFromSeconds),
    activeUntil: isoFromSeconds(input.activeUntilSeconds),
    dataSource: 'BMTC_REALTIME',
    effect: input.effect,
    agencyIds: input.agencyIds,
  };
}
