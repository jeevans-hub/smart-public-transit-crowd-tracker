import type { TransitActivationSnapshot, TransitFeedHealth } from '../types/transit.ts';

export type TransitFeedHealthInput = Partial<Omit<TransitFeedHealth, 'activation'>> & {
  activation?: Partial<TransitActivationSnapshot> | null;
};

export function createDefaultActivation(now = new Date()): TransitActivationSnapshot {
  return {
    state: 'NOT_CONFIGURED',
    decision: 'FALLBACK_DEMO',
    reasons: ['Live provider is not configured'],
    shadowMode: true,
    successfulCycles: 0,
    requiredSuccessfulCycles: 10,
    mapping: null,
    freshness: null,
    positions: null,
    evaluatedAt: now.toISOString(),
  };
}

export function normalizeTransitFeedHealth(input?: TransitFeedHealthInput | null, now = new Date()): TransitFeedHealth {
  const activationDefault = createDefaultActivation(now);
  const activation = input?.activation;
  return {
    status: input?.status ?? 'DEMO',
    provider: input?.provider ?? 'DEMO',
    dataSource: input?.dataSource ?? 'DEMO',
    configured: input?.configured ?? false,
    configurationValid: input?.configurationValid ?? false,
    realFeedVerified: input?.realFeedVerified ?? false,
    verificationStatus: input?.verificationStatus ?? 'NOT_CONFIGURED',
    verificationReason: input?.verificationReason ?? null,
    sourceName: input?.sourceName ?? null,
    sourceTermsUrl: input?.sourceTermsUrl ?? null,
    metroId: input?.metroId ?? null,
    agencyId: input?.agencyId ?? null,
    fallbackActive: input?.fallbackActive ?? true,
    fallbackReason: input?.fallbackReason ?? 'Live provider is not configured; demo fallback is active',
    lastSuccessfulFetch: input?.lastSuccessfulFetch ?? null,
    lastFailure: input?.lastFailure ?? null,
    failureMessage: input?.failureMessage ?? null,
    consecutiveFailures: input?.consecutiveFailures ?? 0,
    feedLatencyMs: input?.feedLatencyMs ?? null,
    vehicleCount: input?.vehicleCount ?? 0,
    tripUpdateCount: input?.tripUpdateCount ?? 0,
    newestVehicleAgeSeconds: input?.newestVehicleAgeSeconds ?? null,
    activation: {
      state: activation?.state ?? activationDefault.state,
      decision: activation?.decision ?? activationDefault.decision,
      reasons: Array.isArray(activation?.reasons) ? activation.reasons : activationDefault.reasons,
      shadowMode: activation?.shadowMode ?? activationDefault.shadowMode,
      successfulCycles: activation?.successfulCycles ?? activationDefault.successfulCycles,
      requiredSuccessfulCycles: activation?.requiredSuccessfulCycles ?? activationDefault.requiredSuccessfulCycles,
      mapping: activation?.mapping ?? null,
      freshness: activation?.freshness ?? null,
      positions: activation?.positions ?? null,
      evaluatedAt: activation?.evaluatedAt ?? activationDefault.evaluatedAt,
    },
    checkedAt: input?.checkedAt ?? now.toISOString(),
  };
}
