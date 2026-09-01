import type { TransitRealtimeProvider, TransitRoute, TransitStop, TransitVehicle, TransitCrowdLevel } from '@/types/transit';

const now = () => new Date().toISOString();

const stops: TransitStop[] = [
  { stopId: 'bmtc-majestic', name: 'Kempegowda Bus Station', latitude: 12.9767, longitude: 77.5713, area: 'Majestic', routes: ['242', '242A', '500', '201'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-magadi', name: 'Magadi Road Toll Gate', latitude: 12.9887, longitude: 77.5114, area: 'Magadi Road', routes: ['242', '242A'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-machohalli', name: 'Machohalli', latitude: 13.0122, longitude: 77.4821, area: 'Machohalli', routes: ['242', '242A'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-vijayanagar', name: 'Vijayanagar Bus Stop', latitude: 12.9719, longitude: 77.5352, area: 'Vijayanagar', routes: ['242', '500'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-kengeri', name: 'Kengeri Satellite Town', latitude: 12.9141, longitude: 77.4827, area: 'Kengeri', routes: ['242A', '500'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-electronic-city', name: 'Electronic City', latitude: 12.8399, longitude: 77.6770, area: 'Electronic City', routes: ['500'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-indiranagar', name: 'Indiranagar', latitude: 12.9784, longitude: 77.6408, area: 'Indiranagar', routes: ['201'], source: 'DEMO', lastUpdated: now() },
  { stopId: 'bmtc-whitefield', name: 'Whitefield Hope Farm', latitude: 12.9698, longitude: 77.7499, area: 'Whitefield', routes: ['201'], source: 'DEMO', lastUpdated: now() },
];

const routes: TransitRoute[] = [
  { routeId: 'bmtc-242', routeNumber: '242', shortName: '242', longName: 'Majestic – Machohalli', origin: 'Kempegowda Bus Station', destination: 'Machohalli', stopIds: ['bmtc-majestic', 'bmtc-magadi', 'bmtc-machohalli'], source: 'DEMO' },
  { routeId: 'bmtc-242a', routeNumber: '242A', shortName: '242A', longName: 'Majestic – Kengeri', origin: 'Kempegowda Bus Station', destination: 'Kengeri Satellite Town', stopIds: ['bmtc-majestic', 'bmtc-vijayanagar', 'bmtc-kengeri'], source: 'DEMO' },
  { routeId: 'bmtc-500', routeNumber: '500', shortName: '500', longName: 'Majestic – Electronic City', origin: 'Kempegowda Bus Station', destination: 'Electronic City', stopIds: ['bmtc-majestic', 'bmtc-vijayanagar', 'bmtc-electronic-city'], source: 'DEMO' },
  { routeId: 'bmtc-201', routeNumber: '201', shortName: '201', longName: 'Majestic – Whitefield', origin: 'Kempegowda Bus Station', destination: 'Whitefield Hope Farm', stopIds: ['bmtc-majestic', 'bmtc-indiranagar', 'bmtc-whitefield'], source: 'DEMO' },
];

function hash(value: string) {
  return Array.from(value).reduce((total, character) => (total * 31 + character.charCodeAt(0)) % 997, 7);
}

function crowdFor(vehicleId: string, routeNumber: string): TransitVehicle['occupancy'] {
  const score = hash(`${vehicleId}:${routeNumber}:${new Date().getHours()}`) % 101;
  const crowdLevel: TransitCrowdLevel = score < 35 ? 'LOW' : score < 60 ? 'MEDIUM' : score < 82 ? 'HIGH' : 'VERY_HIGH';
  return { crowdLevel, crowdScore: score, crowdConfidence: 62 + hash(vehicleId) % 27, crowdSource: 'DEMO', passengerCount: null };
}

function vehiclesForRoutes() {
  const timestamp = Date.now();
  return routes.flatMap((route, routeIndex) => [0, 1].map(vehicleIndex => {
    const vehicleId = `DEMO-${route.routeNumber.replace(/[^0-9A-Z]/gi, '')}-${vehicleIndex + 1}`;
    const direction = vehicleIndex === 0 ? 'OUTBOUND' as const : 'INBOUND' as const;
    const directionalStopIds = direction === 'INBOUND' ? [...route.stopIds].reverse() : route.stopIds;
    const progress = ((Math.floor(timestamp / 30_000) + routeIndex * 2 + vehicleIndex) % 20) / 20;
    const stopIndex = Math.min(Math.floor(progress * (directionalStopIds.length - 1)), directionalStopIds.length - 2);
    const currentStop = stops.find(stop => stop.stopId === directionalStopIds[stopIndex]);
    const nextStop = stops.find(stop => stop.stopId === directionalStopIds[stopIndex + 1]);
    const latitude = (currentStop?.latitude || 12.9716) + ((nextStop?.latitude || 12.9716) - (currentStop?.latitude || 12.9716)) * (progress * (directionalStopIds.length - 1) - stopIndex);
    const longitude = (currentStop?.longitude || 77.5946) + ((nextStop?.longitude || 77.5946) - (currentStop?.longitude || 77.5946)) * (progress * (directionalStopIds.length - 1) - stopIndex);
    return { vehicleId, registrationNumber: null, routeId: route.routeId, tripId: `${route.routeId}-demo-trip-${direction.toLowerCase()}`, direction, latitude, longitude, bearing: hash(vehicleId) % 360, speed: 22 + hash(vehicleId) % 10, currentStopId: currentStop?.stopId || null, nextStopId: nextStop?.stopId || null, timestamp: new Date(timestamp).toISOString(), occupancy: crowdFor(vehicleId, route.routeNumber), dataSource: 'DEMO' as const, isLive: false };
  }));
}

export class DemoBmtcProvider implements TransitRealtimeProvider {
  async getVehiclePositions() { return vehiclesForRoutes(); }
  async getRoutes() { return routes; }
  async getStops() { return stops; }
}
