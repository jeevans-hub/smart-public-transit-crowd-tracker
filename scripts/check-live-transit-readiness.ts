import dotenv from 'dotenv';
import { selectProviderMode } from '../services/transit/providerConfig.ts';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

const decision = selectProviderMode(process.env);
const requested = decision.requestedProvider;
const checks = requested === 'MOOVIT'
  ? ['BMTC_REALTIME_ENABLED', 'MOOVIT_ENABLED', 'MOOVIT_API_KEY', 'MOOVIT_METRO_ID', 'MOOVIT_GTFS_STATIC_URL']
  : ['BMTC_REALTIME_ENABLED', 'BMTC_VEHICLE_POSITIONS_URL', 'BMTC_GTFS_STATIC_URL', 'BMTC_FEED_SOURCE_NAME', 'BMTC_FEED_TERMS_URL'];

console.log('Phase 7E live transit readiness');
console.log(`Requested provider: ${requested}`);
for (const name of checks) console.log(`${name}: ${process.env[name]?.trim() ? 'present' : 'missing'}`);
console.log(`Configuration valid: ${decision.configurationValid ? 'yes' : 'no'}`);
console.log(`Result: ${decision.reason}`);
console.log(decision.mode === 'GTFS_RT' || decision.mode === 'MOOVIT' ? 'Ready for a controlled verification cycle.' : 'KEEPING DEMO MODE. No provider request was made.');
