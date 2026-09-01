import { Wifi, WifiOff } from 'lucide-react';
import type {
  TransitDataSource,
  TransitProviderStatus,
  TransitProviderType,
  TransitProviderVerificationStatus,
  TransitActivationState,
} from '@/types/transit';
import { getTransitDataSourceBadgeState } from '@/utils/transitDataSourceBadge';

export default function TransitDataSourceBadge({
  source,
  status,
  provider,
  verificationStatus,
  fallbackActive = source === 'DEMO',
  activationState,
}: {
  source?: TransitDataSource;
  status?: TransitProviderStatus;
  provider?: TransitProviderType;
  verificationStatus?: TransitProviderVerificationStatus;
  fallbackActive?: boolean;
  activationState?: TransitActivationState;
}) {
  const badge = getTransitDataSourceBadgeState({ source, status, provider, verificationStatus, fallbackActive, activationState });
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${badge.style}`}>
      {badge.connected ? <Wifi size={13} /> : <WifiOff size={13} />}
      {badge.label}
    </span>
  );
}
