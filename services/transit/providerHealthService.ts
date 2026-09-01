import type {
  TransitFeedHealth,
  TransitProviderMetadata,
  TransitProviderType,
  TransitProviderVerification,
  TransitVehicle,
} from '../../types/transit';
import { newestVehicleAgeSeconds } from '../../utils/staleVehicle.ts';

interface SuccessInput {
  provider: TransitProviderType;
  vehicles: TransitVehicle[];
  tripUpdateCount?: number;
  latencyMs: number;
  sourceName: string;
  sourceTermsUrl: string;
  staleAfterSeconds: number;
  verification?: TransitProviderVerification;
  metadata?: TransitProviderMetadata;
  now?: Date;
}

function safeErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown provider error';
  return message
    .replace(/https?:\/\/[^\s]+/gi, '[provider endpoint]')
    .replace(/(api[_-]?key|authorization|token|secret|signature)\s*[:=]\s*\S+/gi, '$1=[redacted]')
    .slice(0, 300);
}

export class ProviderHealthService {
  private state: TransitFeedHealth = {
    status: 'DEMO',
    provider: 'DEMO',
    dataSource: 'DEMO',
    configured: false,
    configurationValid: false,
    realFeedVerified: false,
    verificationStatus: 'NOT_CONFIGURED',
    verificationReason: null,
    sourceName: null,
    sourceTermsUrl: null,
    metroId: null,
    agencyId: null,
    fallbackActive: true,
    fallbackReason: 'Real BMTC provider is not configured',
    lastSuccessfulFetch: null,
    lastFailure: null,
    failureMessage: null,
    consecutiveFailures: 0,
    feedLatencyMs: null,
    vehicleCount: 0,
    tripUpdateCount: 0,
    newestVehicleAgeSeconds: null,
    checkedAt: new Date().toISOString(),
  };

  setDemo(reason: string, configured = false, configurationValid = false, provider: TransitProviderType = 'DEMO') {
    this.state = {
      ...this.state,
      status: 'DEMO',
      provider,
      dataSource: 'DEMO',
      configured,
      configurationValid,
      realFeedVerified: false,
      verificationStatus: 'NOT_CONFIGURED',
      verificationReason: reason,
      sourceName: null,
      sourceTermsUrl: null,
      metroId: null,
      agencyId: null,
      fallbackActive: true,
      fallbackReason: reason,
      failureMessage: null,
      consecutiveFailures: 0,
      vehicleCount: 0,
      tripUpdateCount: 0,
      newestVehicleAgeSeconds: null,
      checkedAt: new Date().toISOString(),
    };
  }

  beginRealProvider(
    provider: TransitProviderType,
    sourceName: string,
    sourceTermsUrl: string,
    metadata?: TransitProviderMetadata,
  ) {
    this.state = {
      ...this.state,
      provider,
      configured: true,
      configurationValid: true,
      realFeedVerified: false,
      verificationStatus: 'UNVERIFIED',
      verificationReason: 'Provider is configured but has not returned a verified fresh feed',
      sourceName,
      sourceTermsUrl,
      metroId: metadata?.metroId ?? null,
      agencyId: metadata?.agencyId ?? null,
      checkedAt: new Date().toISOString(),
    };
  }

  recordRealSuccess(input: SuccessInput): TransitFeedHealth {
    const now = input.now ?? new Date();
    const age = newestVehicleAgeSeconds(input.vehicles, now);
    const liveVehicles = input.vehicles.filter((vehicle) => vehicle.isLive);
    if (liveVehicles.length === 0 || age === null || age > input.staleAfterSeconds) {
      return this.recordFailure(new Error('Provider returned no fresh live vehicles'), input.provider, true, true, now);
    }

    const verification = input.verification ?? {
      status: 'VERIFIED' as const,
      reason: 'Fresh standards-based provider feed passed health checks',
      bengaluruPlausible: null,
      routeMatchCount: 0,
      freshVehicleCount: liveVehicles.length,
    };
    if (verification.status === 'FAILED') {
      this.recordFailure(new Error(verification.reason), input.provider, true, true, now);
      this.state = {
        ...this.state,
        verificationStatus: 'FAILED',
        verificationReason: verification.reason,
        metroId: input.metadata?.metroId ?? this.state.metroId,
        agencyId: input.metadata?.agencyId ?? this.state.agencyId,
      };
      return this.getSnapshot();
    }

    const verified = verification.status === 'VERIFIED';
    this.state = {
      ...this.state,
      status: verified ? 'LIVE' : 'DEGRADED',
      provider: input.provider,
      dataSource: verified ? 'LIVE' : 'DEGRADED',
      configured: true,
      configurationValid: true,
      realFeedVerified: verified,
      verificationStatus: verification.status,
      verificationReason: verification.reason,
      sourceName: input.sourceName,
      sourceTermsUrl: input.sourceTermsUrl,
      metroId: input.metadata?.metroId ?? this.state.metroId,
      agencyId: input.metadata?.agencyId ?? this.state.agencyId,
      fallbackActive: false,
      fallbackReason: null,
      lastSuccessfulFetch: now.toISOString(),
      failureMessage: null,
      consecutiveFailures: 0,
      feedLatencyMs: Math.max(0, Math.round(input.latencyMs)),
      vehicleCount: liveVehicles.length,
      tripUpdateCount: Math.max(0, input.tripUpdateCount ?? 0),
      newestVehicleAgeSeconds: age,
      checkedAt: now.toISOString(),
    };
    return this.getSnapshot();
  }

  recordFailure(
    error: unknown,
    provider: TransitProviderType,
    configured = true,
    configurationValid = true,
    now = new Date(),
  ): TransitFeedHealth {
    const failures = this.state.consecutiveFailures + 1;
    this.state = {
      ...this.state,
      status: failures >= 3 ? 'OFFLINE' : 'DEGRADED',
      provider,
      dataSource: 'DEMO',
      configured,
      configurationValid,
      realFeedVerified: false,
      fallbackActive: true,
      fallbackReason: 'Real provider failed health or verification checks; demo fallback is active',
      lastFailure: now.toISOString(),
      failureMessage: safeErrorMessage(error),
      consecutiveFailures: failures,
      vehicleCount: 0,
      tripUpdateCount: 0,
      newestVehicleAgeSeconds: null,
      checkedAt: now.toISOString(),
    };
    return this.getSnapshot();
  }

  markStale(staleAfterSeconds: number, now = new Date()): TransitFeedHealth {
    if (this.state.fallbackActive || this.state.lastSuccessfulFetch === null) return this.getSnapshot();
    const age = this.state.newestVehicleAgeSeconds === null
      ? null
      : this.state.newestVehicleAgeSeconds + Math.floor((now.getTime() - Date.parse(this.state.checkedAt)) / 1000);
    this.state = {
      ...this.state,
      newestVehicleAgeSeconds: age,
      checkedAt: now.toISOString(),
    };
    if (age !== null && age > staleAfterSeconds) {
      this.state = {
        ...this.state,
        status: 'DEGRADED',
        dataSource: 'DEMO',
        realFeedVerified: false,
        fallbackActive: true,
        fallbackReason: 'Real provider data became stale; demo fallback is active',
      };
    }
    return this.getSnapshot();
  }

  getSnapshot(): TransitFeedHealth {
    return { ...this.state };
  }
}

declare global {
  var bmtcProviderHealth: ProviderHealthService | undefined;
}

export const providerHealthService = globalThis.bmtcProviderHealth ?? new ProviderHealthService();
if (!globalThis.bmtcProviderHealth) globalThis.bmtcProviderHealth = providerHealthService;
