import type {
  TransitRoute,
  TransitServiceAlert,
  TransitStop,
  TransitTripUpdate,
  TransitVehicle,
  TransitVehicleDirection,
} from './transit';

export type GtfsCsvRow = Record<string, string>;

export interface GtfsStaticFiles {
  agency?: GtfsCsvRow[];
  stops: GtfsCsvRow[];
  routes: GtfsCsvRow[];
  trips: GtfsCsvRow[];
  stopTimes: GtfsCsvRow[];
  calendar: GtfsCsvRow[];
  calendarDates: GtfsCsvRow[];
  shapes: GtfsCsvRow[];
}

export interface NormalizedGtfsTrip {
  tripId: string;
  rawTripId: string;
  routeId: string;
  rawRouteId: string;
  serviceId: string;
  direction: TransitVehicleDirection;
  headsign: string;
  shapeId: string | null;
  stopIds: string[];
  rawStopIds: string[];
}

export interface NormalizedGtfsStatic {
  stops: TransitStop[];
  routes: TransitRoute[];
  trips: NormalizedGtfsTrip[];
  calendar: GtfsCsvRow[];
  calendarDates: GtfsCsvRow[];
  shapes: GtfsCsvRow[];
}

export interface GtfsVehicleInput {
  entityId: string;
  vehicleId: string | null;
  vehicleLabel: string | null;
  tripId: string | null;
  routeId: string | null;
  directionId: number | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  speedMetersPerSecond: number | null;
  timestampSeconds: number | null;
  stopId: string | null;
  currentStopSequence: number | null;
  currentStatus: number | null;
  occupancyStatus: number | null;
  occupancyPercentage: number | null;
}

export interface GtfsStopTimeUpdateInput {
  stopId: string | null;
  stopSequence: number | null;
  arrivalTimeSeconds: number | null;
  departureTimeSeconds: number | null;
  delaySeconds: number | null;
}

export interface GtfsTripUpdateInput {
  entityId: string;
  tripId: string | null;
  routeId: string | null;
  vehicleId: string | null;
  directionId: number | null;
  timestampSeconds: number | null;
  stopTimeUpdates: GtfsStopTimeUpdateInput[];
}

export interface GtfsAlertInput {
  entityId: string;
  title: string;
  description: string;
  rawRouteIds: string[];
  rawStopIds: string[];
  agencyIds: string[];
  effect: string | null;
  activeFromSeconds: number | null;
  activeUntilSeconds: number | null;
}

export interface NormalizedGtfsRealtime {
  vehicles: TransitVehicle[];
  tripUpdates: TransitTripUpdate[];
  alerts: TransitServiceAlert[];
}
