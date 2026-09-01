export type TransitDataSource = 'DEMO' | 'BMTC_REALTIME' | 'GTFS_STATIC' | 'EXTERNAL';
export type TransitCrowdLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type CrowdSource = 'LIVE_OCCUPANCY' | 'USER_REPORTS' | 'HISTORICAL_PREDICTION' | 'MIXED' | 'DEMO';
export type EtaSource = 'LIVE_TRIP_UPDATE' | 'GPS_ESTIMATE' | 'HISTORICAL' | 'SCHEDULED' | 'DEMO';
export type TransitVehicleDirection = 'OUTBOUND' | 'INBOUND';
export type TransitProviderStatus = 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'DEMO';
export type TransitProviderType = 'GTFS_RT' | 'MOOVIT' | 'FIXTURE' | 'DEMO';
export type ProviderDataSource = 'LIVE' | 'DEGRADED' | 'DEMO';
export type TransitProviderVerificationStatus = 'NOT_CONFIGURED' | 'VERIFIED' | 'UNVERIFIED' | 'FAILED';
export type TransitActivationState = 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTING' | 'AUTHENTICATED' | 'FEED_RECEIVED' | 'IDENTITY_VERIFIED' | 'LIVE_VALIDATING' | 'LIVE_VERIFIED' | 'DEGRADED' | 'FAILED' | 'DEMO_FALLBACK';
export type TransitActivationDecision = 'ALLOW_LIVE' | 'KEEP_SHADOW' | 'DEGRADE' | 'FALLBACK_DEMO';
export type TransitMappingGrade = 'GOOD' | 'DEGRADED' | 'FAIL';

export interface TransitStaticValidationContext {
  tripIds: string[];
  routeIds: string[];
  stopIds: string[];
}

export interface TransitMappingMetrics {
  vehicleToTripPercent: number;
  tripToRoutePercent: number;
  tripUpdateToStaticTripPercent: number;
  stopTimeToStaticStopPercent: number;
  overallPercent: number;
  grade: TransitMappingGrade;
}

export interface TransitFreshnessMetrics {
  newestAgeSeconds: number | null;
  medianAgeSeconds: number | null;
  oldestAgeSeconds: number | null;
  freshCount: number;
  staleCount: number;
  freshPercent: number;
}

export interface TransitPositionMetrics {
  validCount: number;
  suspiciousCount: number;
  invalidCount: number;
  rejectedCount: number;
}

export interface TransitActivationSnapshot {
  state: TransitActivationState;
  decision: TransitActivationDecision;
  reasons: string[];
  shadowMode: boolean;
  successfulCycles: number;
  requiredSuccessfulCycles: number;
  mapping: TransitMappingMetrics | null;
  freshness: TransitFreshnessMetrics | null;
  positions: TransitPositionMetrics | null;
  evaluatedAt: string;
}

export interface TransitStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  area: string;
  routes: string[];
  source: TransitDataSource;
  lastUpdated: string;
}

export interface TransitRoute {
  routeId: string;
  routeNumber: string;
  shortName: string;
  longName: string;
  origin: string;
  destination: string;
  stopIds: string[];
  source: TransitDataSource;
  agencyId?: string | null;
  agencyName?: string | null;
}

export interface CrowdEstimate {
  crowdLevel: TransitCrowdLevel;
  crowdScore: number;
  crowdConfidence: number;
  crowdSource: CrowdSource;
  passengerCount: number | null;
}

export interface TransitVehicle {
  vehicleId: string;
  registrationNumber: string | null;
  routeId: string;
  tripId: string;
  direction: TransitVehicleDirection;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: number | null;
  currentStopId: string | null;
  nextStopId: string | null;
  timestamp: string;
  occupancy: CrowdEstimate;
  rawOccupancyStatus?: string | null;
  dataSource: TransitDataSource;
  isLive: boolean;
  provider?: TransitProviderType;
}

export interface TransitStopTimeUpdate {
  stopId: string;
  arrivalTime: string | null;
  departureTime: string | null;
  delaySeconds: number | null;
  etaMinutes: number | null;
  etaSource: EtaSource;
}

export interface TransitTripUpdate {
  tripId: string;
  routeId: string;
  vehicleId: string | null;
  timestamp: string;
  stopTimeUpdates: TransitStopTimeUpdate[];
  dataSource: TransitDataSource;
  provider?: TransitProviderType;
}

export interface TransitServiceAlert {
  alertId: string;
  title: string;
  description: string;
  routeIds: string[];
  stopIds: string[];
  activeFrom: string | null;
  activeUntil: string | null;
  dataSource: TransitDataSource;
  effect?: string | null;
  agencyIds?: string[];
  provider?: TransitProviderType;
}

export interface TransitProviderMetadata {
  provider: TransitProviderType;
  sourceName: string;
  sourceTermsUrl: string;
  metroId: string | null;
  agencyId: string | null;
}

export interface TransitProviderVerification {
  status: Exclude<TransitProviderVerificationStatus, 'NOT_CONFIGURED'>;
  reason: string;
  bengaluruPlausible: boolean | null;
  routeMatchCount: number;
  freshVehicleCount: number;
}

export interface TransitProviderSnapshot {
  routes: TransitRoute[];
  vehicles: TransitVehicle[];
  tripUpdates: TransitTripUpdate[];
}

export interface TransitFeedHealth {
  status: TransitProviderStatus;
  provider: TransitProviderType;
  dataSource: ProviderDataSource;
  configured: boolean;
  configurationValid: boolean;
  realFeedVerified: boolean;
  verificationStatus: TransitProviderVerificationStatus;
  verificationReason: string | null;
  sourceName: string | null;
  sourceTermsUrl: string | null;
  metroId: string | null;
  agencyId: string | null;
  fallbackActive: boolean;
  fallbackReason: string | null;
  lastSuccessfulFetch: string | null;
  lastFailure: string | null;
  failureMessage: string | null;
  consecutiveFailures: number;
  feedLatencyMs: number | null;
  vehicleCount: number;
  tripUpdateCount: number;
  newestVehicleAgeSeconds: number | null;
  activation: TransitActivationSnapshot;
  checkedAt: string;
}

export interface VehicleArrival {
  routeId: string;
  routeNumber: string;
  vehicleId: string;
  direction: TransitVehicleDirection;
  destination: string;
  distanceMeters: number;
  etaMinutes: number;
  etaConfidence: number;
  etaSource: EtaSource;
  delayMinutes: number;
  crowd: CrowdEstimate;
  isLive: boolean;
  dataSource: TransitDataSource;
}

export interface TransitRealtimeProvider {
  readonly providerType?: TransitProviderType;
  getVehiclePositions(): Promise<TransitVehicle[]>;
  getRoutes(): Promise<TransitRoute[]>;
  getStops(): Promise<TransitStop[]>;
  getTripUpdates?(): Promise<TransitTripUpdate[]>;
  getServiceAlerts?(): Promise<TransitServiceAlert[]>;
  getFeedHealth?(): Promise<Partial<TransitFeedHealth>>;
  getProviderMetadata?(): TransitProviderMetadata;
  getStaticValidationContext?(): Promise<TransitStaticValidationContext>;
  verifySnapshot?(snapshot: TransitProviderSnapshot): TransitProviderVerification;
}
