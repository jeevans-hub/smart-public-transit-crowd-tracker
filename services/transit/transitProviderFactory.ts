import type { TransitRealtimeProvider } from '../../types/transit';
import { BmtcRealtimeProvider } from './bmtcRealtimeProvider';
import { DemoBmtcProvider } from './demoBmtcProvider';
import { FixtureBmtcProvider } from './fixtureBmtcProvider';
import { MoovitTransitProvider } from './moovitTransitProvider';
import { selectProviderMode, type ProviderModeDecision } from './providerConfig';

export interface TransitProviderSelection extends ProviderModeDecision {
  provider: TransitRealtimeProvider;
  demoProvider: DemoBmtcProvider;
}

export function createTransitProvider(env: Readonly<Record<string, string | undefined>> = process.env): TransitProviderSelection {
  const decision = selectProviderMode(env);
  const demoProvider = new DemoBmtcProvider();
  if (decision.mode === 'GTFS_RT' && decision.config?.providerType === 'GTFS_RT') {
    return {
      ...decision,
      provider: new BmtcRealtimeProvider(decision.config),
      demoProvider,
    };
  }
  if (decision.mode === 'MOOVIT' && decision.config?.providerType === 'MOOVIT') {
    return {
      ...decision,
      provider: new MoovitTransitProvider(decision.config),
      demoProvider,
    };
  }
  if (decision.mode === 'FIXTURE') {
    return {
      ...decision,
      provider: new FixtureBmtcProvider(),
      demoProvider,
    };
  }
  return { ...decision, provider: demoProvider, demoProvider };
}

export { selectProviderMode } from './providerConfig';
export type { ProviderModeDecision, ProviderRuntimeConfig } from './providerConfig';
