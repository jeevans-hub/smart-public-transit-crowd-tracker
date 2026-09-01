import type { TransitProviderType } from '../../types/transit';
import type { BmtcRealtimeProviderConfig } from './bmtcRealtimeProvider';
import type {
  MoovitAuthMode,
  MoovitTransitProviderConfig,
} from './moovitTransitProvider';

const MOOVIT_DOCUMENTED_API_BASE_URL = 'https://api.moovitapp.com/services-app/services/EX/API';
const MOOVIT_DOCUMENTATION_URL = 'https://api-docs.moovit.com/api-docs/5.1/MoovitPublicTransitAPIs.html';

export type GtfsProviderRuntimeConfig = BmtcRealtimeProviderConfig & {
  enabled: true;
  providerType: 'GTFS_RT';
  refreshIntervalMs: number;
};

export type MoovitProviderRuntimeConfig = MoovitTransitProviderConfig & {
  enabled: true;
  providerType: 'MOOVIT';
};

export type ProviderRuntimeConfig = GtfsProviderRuntimeConfig | MoovitProviderRuntimeConfig;

export interface ProviderModeDecision {
  mode: TransitProviderType;
  requestedProvider: TransitProviderType;
  configured: boolean;
  configurationValid: boolean;
  reason: string;
  config: ProviderRuntimeConfig | null;
}

function positiveInteger(value: string | undefined, fallback: number, minimum: number, maximum: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) return fallback;
  return parsed;
}

function validEndpoint(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validHttpsEndpoint(value: string | undefined): boolean {
  if (!validEndpoint(value)) return false;
  return new URL(value as string).protocol === 'https:';
}

function optionalEndpoint(value: string | undefined): string | null {
  return value && validEndpoint(value) ? value : null;
}

function validNumericId(value: string | undefined): boolean {
  return Boolean(value && /^[1-9]\d*$/.test(value.trim()));
}

function knownProvider(value: string): TransitProviderType {
  return value === 'MOOVIT' || value === 'FIXTURE' || value === 'DEMO' ? value : 'GTFS_RT';
}

function invalidDecision(requestedProvider: TransitProviderType, reason: string, configured = true): ProviderModeDecision {
  return {
    mode: 'DEMO',
    requestedProvider,
    configured,
    configurationValid: false,
    reason,
    config: null,
  };
}

function selectMoovitMode(env: Readonly<Record<string, string | undefined>>): ProviderModeDecision {
  if (env.MOOVIT_ENABLED?.toLowerCase() !== 'true') {
    return invalidDecision('MOOVIT', 'Moovit provider is disabled; set MOOVIT_ENABLED=true only after authorized access is configured', false);
  }

  const apiBaseUrl = env.MOOVIT_API_BASE_URL?.trim() || MOOVIT_DOCUMENTED_API_BASE_URL;
  const apiKey = env.MOOVIT_API_KEY?.trim();
  const metroId = env.MOOVIT_METRO_ID?.trim();
  const agencyId = env.MOOVIT_AGENCY_ID?.trim() || null;
  const gtfsStaticUrl = env.MOOVIT_GTFS_STATIC_URL?.trim() || env.BMTC_GTFS_STATIC_URL?.trim();
  const authMode = (env.MOOVIT_AUTH_MODE?.trim().toUpperCase() || 'API_KEY') as MoovitAuthMode;
  const transitType = env.MOOVIT_TRANSIT_TYPE?.trim().toUpperCase() || 'BUS';
  const hmacEncoding = env.MOOVIT_HMAC_ENCODING?.trim().toLowerCase() || 'hex';

  if (!validHttpsEndpoint(apiBaseUrl)) {
    return invalidDecision('MOOVIT', 'MOOVIT_API_BASE_URL must be a valid HTTPS URL');
  }
  if (!apiKey) return invalidDecision('MOOVIT', 'MOOVIT_API_KEY is required for authorized Moovit access');
  if (!validNumericId(metroId)) {
    return invalidDecision('MOOVIT', 'MOOVIT_METRO_ID is required and must be the numeric ID supplied for the Moovit account');
  }
  if (agencyId && !validNumericId(agencyId)) {
    return invalidDecision('MOOVIT', 'MOOVIT_AGENCY_ID must be a numeric account-provided agency ID when configured');
  }
  if (transitType !== 'BUS') {
    return invalidDecision('MOOVIT', 'This BMTC provider requires MOOVIT_TRANSIT_TYPE=BUS');
  }
  if (authMode !== 'API_KEY' && authMode !== 'HMAC') {
    return invalidDecision('MOOVIT', 'MOOVIT_AUTH_MODE must be API_KEY or HMAC');
  }
  if (authMode === 'HMAC' && !env.MOOVIT_API_SECRET?.trim()) {
    return invalidDecision('MOOVIT', 'MOOVIT_API_SECRET is required when MOOVIT_AUTH_MODE=HMAC');
  }
  if (hmacEncoding !== 'hex' && hmacEncoding !== 'base64') {
    return invalidDecision('MOOVIT', 'MOOVIT_HMAC_ENCODING must be hex or base64');
  }
  if (!validEndpoint(gtfsStaticUrl)) {
    return invalidDecision('MOOVIT', 'A compatible GTFS static URL is required through MOOVIT_GTFS_STATIC_URL or BMTC_GTFS_STATIC_URL');
  }

  const config: MoovitProviderRuntimeConfig = {
    enabled: true,
    providerType: 'MOOVIT',
    apiBaseUrl,
    apiKey,
    apiSecret: env.MOOVIT_API_SECRET?.trim() || null,
    authMode,
    hmacEncoding: hmacEncoding as 'hex' | 'base64',
    metroId: metroId as string,
    agencyId,
    transitType: 'BUS',
    gtfsStaticUrl: gtfsStaticUrl as string,
    requestTimeoutMs: positiveInteger(env.MOOVIT_REQUEST_TIMEOUT_MS, 10_000, 1_000, 120_000),
    refreshIntervalMs: positiveInteger(env.MOOVIT_REFRESH_INTERVAL_MS, 30_000, 5_000, 3_600_000),
    staleAfterSeconds: positiveInteger(env.MOOVIT_STALE_AFTER_SECONDS, 120, 15, 86_400),
    sourceName: 'Moovit',
    sourceTermsUrl: MOOVIT_DOCUMENTATION_URL,
  };
  return {
    mode: 'MOOVIT',
    requestedProvider: 'MOOVIT',
    configured: true,
    configurationValid: true,
    reason: 'Moovit configuration is complete; Bengaluru/BMTC feed identity and freshness must still be verified',
    config,
  };
}

export function selectProviderMode(env: Readonly<Record<string, string | undefined>> = process.env): ProviderModeDecision {
  const enabled = env.BMTC_REALTIME_ENABLED?.toLowerCase() === 'true';
  const requestedType = env.BMTC_PROVIDER_TYPE?.toUpperCase() || 'GTFS_RT';
  const requestedProvider = knownProvider(requestedType);
  if (!enabled) {
    return invalidDecision(requestedProvider, 'BMTC real-time mode is disabled', false);
  }
  if (requestedType === 'MOOVIT') return selectMoovitMode(env);
  if (requestedType === 'FIXTURE') {
    return {
      mode: 'FIXTURE',
      requestedProvider: 'FIXTURE',
      configured: true,
      configurationValid: true,
      reason: 'Local fixture provider selected; fixture data is never labeled live',
      config: null,
    };
  }
  if (requestedType !== 'GTFS_RT') {
    return invalidDecision(requestedProvider, `Unsupported BMTC provider type: ${requestedType}`);
  }

  const required = {
    vehiclePositionsUrl: env.BMTC_VEHICLE_POSITIONS_URL,
    gtfsStaticUrl: env.BMTC_GTFS_STATIC_URL,
    sourceName: env.BMTC_FEED_SOURCE_NAME,
    sourceTermsUrl: env.BMTC_FEED_TERMS_URL,
  };
  if (!validEndpoint(required.vehiclePositionsUrl) || !validEndpoint(required.gtfsStaticUrl)) {
    return invalidDecision('GTFS_RT', 'GTFS-Realtime vehicle and GTFS static URLs are required and must be valid HTTP(S) URLs');
  }
  if (!required.sourceName?.trim() || !validEndpoint(required.sourceTermsUrl)) {
    return invalidDecision('GTFS_RT', 'Feed source name and a valid public documentation/terms URL are required for provenance');
  }
  const apiKeyHeader = env.BMTC_API_KEY_HEADER?.trim() || 'x-api-key';
  if (!/^[A-Za-z0-9-]+$/.test(apiKeyHeader)) {
    return invalidDecision('GTFS_RT', 'BMTC_API_KEY_HEADER contains invalid characters');
  }
  if (env.BMTC_API_KEY && (
    required.vehiclePositionsUrl?.startsWith('http:')
    || required.gtfsStaticUrl?.startsWith('http:')
  )) {
    return invalidDecision('GTFS_RT', 'HTTPS is required when a provider API key is configured');
  }

  const config: GtfsProviderRuntimeConfig = {
    enabled: true,
    providerType: 'GTFS_RT',
    vehiclePositionsUrl: required.vehiclePositionsUrl as string,
    tripUpdatesUrl: optionalEndpoint(env.BMTC_TRIP_UPDATES_URL),
    alertsUrl: optionalEndpoint(env.BMTC_ALERTS_URL),
    gtfsStaticUrl: required.gtfsStaticUrl as string,
    apiKey: env.BMTC_API_KEY?.trim() || null,
    apiKeyHeader,
    refreshIntervalMs: positiveInteger(env.BMTC_REFRESH_INTERVAL_MS, 30_000, 5_000, 3_600_000),
    staleAfterSeconds: positiveInteger(env.BMTC_STALE_AFTER_SECONDS, 120, 15, 86_400),
    requestTimeoutMs: positiveInteger(env.BMTC_REQUEST_TIMEOUT_MS, 10_000, 1_000, 120_000),
    sourceName: required.sourceName.trim(),
    sourceTermsUrl: required.sourceTermsUrl as string,
  };
  return {
    mode: 'GTFS_RT',
    requestedProvider: 'GTFS_RT',
    configured: true,
    configurationValid: true,
    reason: 'GTFS-Realtime provider configuration is complete; feed health must still be verified',
    config,
  };
}
