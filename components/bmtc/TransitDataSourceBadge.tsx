import { Wifi, WifiOff } from 'lucide-react';
import type {
  TransitDataSource,
  TransitProviderStatus,
  TransitProviderType,
  TransitProviderVerificationStatus,
} from '@/types/transit';

export default function TransitDataSourceBadge({
  source,
  status,
  provider,
  verificationStatus,
  fallbackActive = source === 'DEMO',
}: {
  source: TransitDataSource;
  status?: TransitProviderStatus;
  provider?: TransitProviderType;
  verificationStatus?: TransitProviderVerificationStatus;
  fallbackActive?: boolean;
}) {
  const effectiveStatus = status ?? (source === 'BMTC_REALTIME' ? 'LIVE' : 'DEMO');
  const isVerifiedBmtc = source === 'BMTC_REALTIME'
    && effectiveStatus === 'LIVE'
    && (verificationStatus === 'VERIFIED' || verificationStatus === undefined)
    && !fallbackActive;
  const isUnverifiedMoovit = source === 'EXTERNAL'
    && (provider === 'MOOVIT' || provider === undefined)
    && (verificationStatus === 'UNVERIFIED' || verificationStatus === undefined)
    && !fallbackActive;
  const isDegraded = !fallbackActive
    && !isUnverifiedMoovit
    && (effectiveStatus === 'DEGRADED' || effectiveStatus === 'OFFLINE');
  const style = isVerifiedBmtc
    ? 'bg-emerald-100 text-emerald-800'
    : isUnverifiedMoovit ? 'bg-blue-100 text-blue-800'
      : isDegraded ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800';
  const label = isVerifiedBmtc
    ? 'LIVE BMTC DATA'
    : isUnverifiedMoovit ? 'LIVE TRANSIT DATA — UNVERIFIED'
      : isDegraded ? 'DEGRADED LIVE DATA' : 'DEMO TRANSIT DATA';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {isVerifiedBmtc || isUnverifiedMoovit ? <Wifi size={13} /> : <WifiOff size={13} />}
      {label}
    </span>
  );
}
