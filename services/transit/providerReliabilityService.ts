export interface TransitProviderReliabilityMetrics {
  totalCycles: number;
  successfulCycles: number;
  uptimePercent: number | null;
  rateLimitFailures: number;
  timeoutFailures: number;
  authenticationFailures: number;
  staleFailures: number;
  otherFailures: number;
  averageLatencyMs: number | null;
}

export class ProviderReliabilityService {
  private totalCycles = 0;
  private successfulCycles = 0;
  private latencyTotal = 0;
  private rateLimitFailures = 0;
  private timeoutFailures = 0;
  private authenticationFailures = 0;
  private staleFailures = 0;
  private otherFailures = 0;

  recordSuccess(latencyMs: number, details?: { provider: TransitProviderType; activation: TransitActivationSnapshot; vehicleCount: number }) {
    this.totalCycles += 1;
    this.successfulCycles += 1;
    this.latencyTotal += Math.max(0, latencyMs);
    if (details) void this.persist({
      provider: details.provider, state: details.activation.state, decision: details.activation.decision,
      success: true, latencyMs, vehicleCount: details.vehicleCount,
      freshPercent: details.activation.freshness?.freshPercent ?? null,
      mappingPercent: details.activation.mapping?.overallPercent ?? null,
      failureKind: null,
    });
  }

  recordFailure(error: unknown, provider: TransitProviderType = 'GTFS_RT') {
    this.totalCycles += 1;
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : null;
    const failureKind = status === 429 || message.includes('429') || message.includes('rate limit') ? 'RATE_LIMIT'
      : status === 401 || status === 403 || message.includes('unauthorized') || message.includes('authentication') ? 'AUTH'
        : message.includes('timeout') || message.includes('timed out') || (error instanceof Error && error.name === 'AbortError') ? 'TIMEOUT'
          : message.includes('stale') || message.includes('no fresh') ? 'STALE' : 'OTHER';
    if (failureKind === 'RATE_LIMIT') this.rateLimitFailures += 1;
    else if (failureKind === 'AUTH') this.authenticationFailures += 1;
    else if (failureKind === 'TIMEOUT') this.timeoutFailures += 1;
    else if (failureKind === 'STALE') this.staleFailures += 1;
    else this.otherFailures += 1;
    void this.persist({ provider, state: 'FAILED', decision: 'FALLBACK_DEMO', success: false, latencyMs: null, vehicleCount: 0, freshPercent: null, mappingPercent: null, httpStatus: status, failureKind });
  }

  private async persist(sample: Record<string, unknown>) {
    if (!process.env.MONGODB_URI) return;
    try { await connectDB(); await TransitProviderHealthSample.create({ ...sample, sampledAt: new Date() }); } catch { /* Diagnostics persistence must never break ingestion. */ }
  }

  getSnapshot(): TransitProviderReliabilityMetrics {
    return {
      totalCycles: this.totalCycles,
      successfulCycles: this.successfulCycles,
      uptimePercent: this.totalCycles === 0 ? null : Math.round(this.successfulCycles / this.totalCycles * 10_000) / 100,
      rateLimitFailures: this.rateLimitFailures,
      timeoutFailures: this.timeoutFailures,
      authenticationFailures: this.authenticationFailures,
      staleFailures: this.staleFailures,
      otherFailures: this.otherFailures,
      averageLatencyMs: this.successfulCycles === 0 ? null : Math.round(this.latencyTotal / this.successfulCycles),
    };
  }
}

declare global { var bmtcProviderReliability: ProviderReliabilityService | undefined; }
export const providerReliabilityService = globalThis.bmtcProviderReliability ?? new ProviderReliabilityService();
if (!globalThis.bmtcProviderReliability) globalThis.bmtcProviderReliability = providerReliabilityService;
import connectDB from '../../lib/mongodb.ts';
import TransitProviderHealthSample from '../../models/TransitProviderHealthSample.ts';
import type { TransitActivationSnapshot, TransitProviderType } from '../../types/transit.ts';
