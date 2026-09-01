import type {
  TransitActivationState,
  TransitDataSource,
  TransitProviderStatus,
  TransitProviderType,
  TransitProviderVerificationStatus,
} from '../types/transit.ts';

export interface TransitDataSourceBadgeInput {
  source?: TransitDataSource;
  status?: TransitProviderStatus;
  provider?: TransitProviderType;
  verificationStatus?: TransitProviderVerificationStatus;
  fallbackActive?: boolean;
  activationState?: TransitActivationState;
}

export function getTransitDataSourceBadgeState(input: TransitDataSourceBadgeInput = {}) {
  const source = input.source ?? 'DEMO';
  const fallbackActive = input.fallbackActive ?? source === 'DEMO';
  const effectiveStatus = input.status ?? (source === 'BMTC_REALTIME' ? 'LIVE' : 'DEMO');
  const isVerifiedBmtc = source === 'BMTC_REALTIME'
    && effectiveStatus === 'LIVE'
    && input.verificationStatus === 'VERIFIED'
    && input.activationState === 'LIVE_VERIFIED'
    && !fallbackActive;
  const isUnverifiedTransit = source === 'EXTERNAL'
    && (input.provider === 'MOOVIT' || input.provider === undefined)
    && (input.verificationStatus === 'UNVERIFIED' || input.verificationStatus === undefined)
    && !fallbackActive;
  const isShadow = input.activationState === 'LIVE_VALIDATING';
  const isDegraded = !fallbackActive && !isUnverifiedTransit
    && (effectiveStatus === 'DEGRADED' || effectiveStatus === 'OFFLINE');
  if (isVerifiedBmtc) return { label: 'LIVE BMTC DATA', style: 'bg-emerald-100 text-emerald-800', connected: true };
  if (isShadow) return { label: 'LIVE SHADOW MODE', style: 'bg-blue-100 text-blue-800', connected: false };
  if (isUnverifiedTransit) return { label: 'LIVE TRANSIT DATA — UNVERIFIED', style: 'bg-blue-100 text-blue-800', connected: true };
  if (isDegraded) return { label: 'DEGRADED LIVE DATA', style: 'bg-orange-100 text-orange-800', connected: false };
  return { label: 'DEMO TRANSIT DATA', style: 'bg-amber-100 text-amber-800', connected: false };
}
