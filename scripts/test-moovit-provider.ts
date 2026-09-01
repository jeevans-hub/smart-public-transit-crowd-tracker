import { config as loadDotenv } from 'dotenv';
import { GtfsRealtimeFetchError } from '../services/transit/gtfs/gtfsRealtimeLoader.ts';
import { createTransitProvider } from '../services/transit/transitProviderFactory.ts';
import { newestVehicleAgeSeconds } from '../utils/staleVehicle.ts';

loadDotenv({ path: '.env.local', quiet: true });
loadDotenv({ path: '.env', quiet: true });

const environment = { ...process.env, BMTC_PROVIDER_TYPE: 'MOOVIT' };
const selection = createTransitProvider(environment);
console.log('Provider: MOOVIT');
console.log(`Moovit enabled: ${process.env.MOOVIT_ENABLED?.toLowerCase() === 'true' ? 'yes' : 'no'}`);
console.log(`Metro ID configured: ${process.env.MOOVIT_METRO_ID?.trim() ? 'yes' : 'no'}`);
console.log(`Agency filter configured: ${process.env.MOOVIT_AGENCY_ID?.trim() ? 'yes' : 'no'}`);

if (selection.mode !== 'MOOVIT' || selection.config?.providerType !== 'MOOVIT') {
  console.log('HTTP connectivity: NOT TESTED');
  console.log('Authentication: NOT TESTED');
  console.log('Vehicle feed entities: 0');
  console.log('Trip update entities: 0');
  console.log('Newest timestamp age: unavailable');
  console.log('Verification: NOT_CONFIGURED');
  console.log('Moovit credentials/access are not configured; deterministic demo fallback remains active.');
} else {
  try {
    const provider = selection.provider;
    const [routes, vehicles, tripUpdates] = await Promise.all([
      provider.getRoutes(),
      provider.getVehiclePositions(),
      provider.getTripUpdates?.() ?? Promise.resolve([]),
    ]);
    const verification = provider.verifySnapshot?.({ routes, vehicles, tripUpdates });
    console.log('HTTP connectivity: OK');
    console.log('Authentication: OK');
    console.log(`Vehicle feed entities: ${vehicles.length}`);
    console.log(`Trip update entities: ${tripUpdates.length}`);
    const age = newestVehicleAgeSeconds(vehicles);
    console.log(`Newest timestamp age: ${age === null ? 'unavailable' : `${age}s`}`);
    console.log(`Verification: ${verification?.status ?? 'UNVERIFIED'}`);
  } catch (error) {
    const status = error instanceof GtfsRealtimeFetchError ? error.status : null;
    console.log('HTTP connectivity: FAILED');
    console.log(`Authentication: ${status === 401 || status === 403 ? 'FAILED' : 'UNKNOWN'}`);
    console.log('Vehicle feed entities: 0');
    console.log('Trip update entities: 0');
    console.log('Newest timestamp age: unavailable');
    console.log('Verification: FAILED');
    console.log(`Safe failure category: ${status ? `HTTP ${status}` : 'provider request failed'}`);
    process.exitCode = 1;
  }
}
