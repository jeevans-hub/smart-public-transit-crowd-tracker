import type {
  TransitActivationDecision,
  TransitActivationSnapshot,
  TransitFreshnessMetrics,
  TransitMappingMetrics,
  TransitPositionMetrics,
  TransitProviderVerification,
} from '../../types/transit';

export interface LiveActivationInput {
  configured: boolean;
  authenticated: boolean;
  verification: TransitProviderVerification | undefined;
  mapping: TransitMappingMetrics;
  freshness: TransitFreshnessMetrics;
  positions: TransitPositionMetrics;
  vehicleCount: number;
  requestSucceeded: boolean;
  now?: Date;
}

export interface LiveActivationConfig {
  shadowMode: boolean;
  requiredSuccessfulCycles: number;
  minimumMappingPercent: number;
  minimumFreshPercent: number;
  minimumVehicleCount: number;
  maximumErrorRatePercent: number;
}

function integer(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

export function getLiveActivationConfig(env: Readonly<Record<string, string | undefined>> = process.env): LiveActivationConfig {
  return {
    shadowMode: env.BMTC_LIVE_SHADOW_MODE?.toLowerCase() !== 'false',
    requiredSuccessfulCycles: integer(env.BMTC_ACTIVATION_REQUIRED_CYCLES, 10, 1, 1000),
    minimumMappingPercent: integer(env.BMTC_MAPPING_MIN_PERCENT, 80, 1, 100),
    minimumFreshPercent: integer(env.BMTC_FRESHNESS_MIN_PERCENT, 90, 1, 100),
    minimumVehicleCount: integer(env.BMTC_ACTIVATION_MIN_VEHICLES, 1, 1, 100000),
    maximumErrorRatePercent: integer(env.BMTC_ACTIVATION_MAX_ERROR_PERCENT, 10, 0, 100),
  };
}

export class LiveActivationService {
  private readonly config: LiveActivationConfig;
  private successfulCycles = 0;
  private totalCycles = 0;
  private failedCycles = 0;
  private snapshot: TransitActivationSnapshot;

  constructor(config: LiveActivationConfig = getLiveActivationConfig()) {
    this.config = config;
    this.snapshot = {
      state: 'NOT_CONFIGURED', decision: 'FALLBACK_DEMO', reasons: ['Real provider is not configured'],
      shadowMode: config.shadowMode, successfulCycles: 0, requiredSuccessfulCycles: config.requiredSuccessfulCycles,
      mapping: null, freshness: null, positions: null, evaluatedAt: new Date().toISOString(),
    };
  }

  evaluate(input: LiveActivationInput): TransitActivationSnapshot {
    this.totalCycles += 1;
    const reasons: string[] = [];
    let decision: TransitActivationDecision = 'KEEP_SHADOW';
    let state: TransitActivationSnapshot['state'] = 'LIVE_VALIDATING';
    if (!input.configured) reasons.push('Provider configuration is incomplete');
    if (!input.authenticated) reasons.push('Provider authentication has not succeeded');
    if (input.verification?.status !== 'VERIFIED') reasons.push(input.verification?.reason || 'BMTC feed identity is not verified');
    if (input.mapping.overallPercent < this.config.minimumMappingPercent) reasons.push(`Static/live mapping is ${input.mapping.overallPercent}%`);
    if (input.freshness.freshPercent < this.config.minimumFreshPercent) reasons.push(`Fresh vehicle rate is ${input.freshness.freshPercent}%`);
    if (input.vehicleCount < this.config.minimumVehicleCount) reasons.push(`Only ${input.vehicleCount} live vehicles were received`);
    if (input.positions.invalidCount > 0) reasons.push(`${input.positions.invalidCount} invalid positions were rejected`);
    if (!input.requestSucceeded) reasons.push('Provider request failed');

    const cyclePassed = reasons.length === 0;
    if (cyclePassed) this.successfulCycles += 1;
    else {
      this.failedCycles += 1;
      this.successfulCycles = 0;
    }
    const errorRate = this.totalCycles === 0 ? 0 : this.failedCycles / this.totalCycles * 100;
    if (errorRate > this.config.maximumErrorRatePercent) reasons.push(`Observed error rate ${Math.round(errorRate)}% exceeds the activation limit`);

    if (!input.configured) { state = 'NOT_CONFIGURED'; decision = 'FALLBACK_DEMO'; }
    else if (!input.requestSucceeded || input.verification?.status === 'FAILED' || input.mapping.grade === 'FAIL') {
      state = 'FAILED'; decision = 'FALLBACK_DEMO';
    } else if (!cyclePassed || errorRate > this.config.maximumErrorRatePercent) {
      state = 'DEGRADED'; decision = 'DEGRADE';
    } else if (this.successfulCycles < this.config.requiredSuccessfulCycles || this.config.shadowMode) {
      state = 'LIVE_VALIDATING'; decision = 'KEEP_SHADOW';
      reasons.push(this.config.shadowMode
        ? 'Live shadow mode is enabled; validated feed remains isolated from the main UI'
        : `${this.successfulCycles}/${this.config.requiredSuccessfulCycles} stable validation cycles completed`);
    } else {
      state = 'LIVE_VERIFIED'; decision = 'ALLOW_LIVE';
      reasons.push('All activation gates passed for the required stable cycles');
    }

    this.snapshot = {
      state, decision, reasons, shadowMode: this.config.shadowMode,
      successfulCycles: this.successfulCycles,
      requiredSuccessfulCycles: this.config.requiredSuccessfulCycles,
      mapping: input.mapping, freshness: input.freshness, positions: input.positions,
      evaluatedAt: (input.now ?? new Date()).toISOString(),
    };
    return this.getSnapshot();
  }

  recordFailure(configured: boolean, reason: string, now = new Date()): TransitActivationSnapshot {
    this.totalCycles += 1;
    this.failedCycles += 1;
    this.successfulCycles = 0;
    this.snapshot = {
      ...this.snapshot,
      state: configured ? 'FAILED' : 'NOT_CONFIGURED',
      decision: 'FALLBACK_DEMO',
      reasons: [reason],
      successfulCycles: 0,
      evaluatedAt: now.toISOString(),
    };
    return this.getSnapshot();
  }

  getSnapshot(): TransitActivationSnapshot {
    return { ...this.snapshot, reasons: [...this.snapshot.reasons] };
  }
}

declare global { var bmtcLiveActivation: LiveActivationService | undefined; }
export const liveActivationService = globalThis.bmtcLiveActivation ?? new LiveActivationService();
if (!globalThis.bmtcLiveActivation) globalThis.bmtcLiveActivation = liveActivationService;
