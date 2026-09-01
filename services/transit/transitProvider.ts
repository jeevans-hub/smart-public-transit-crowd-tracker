import type { TransitRealtimeProvider } from '@/types/transit';
import { createTransitProvider } from './transitProviderFactory';
import { DemoBmtcProvider } from './demoBmtcProvider';

export function getBmtcProvider(): TransitRealtimeProvider {
  return createTransitProvider().provider;
}

export function getDemoBmtcProvider() { return new DemoBmtcProvider(); }

export { createTransitProvider, selectProviderMode } from './transitProviderFactory';
