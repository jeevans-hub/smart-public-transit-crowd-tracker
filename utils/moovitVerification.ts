import type {
  TransitProviderSnapshot,
  TransitProviderVerification,
  TransitRoute,
  TransitVehicle,
} from '../types/transit';
import { haversineDistanceMeters } from './geoDistance.ts';

const BENGALURU_CENTER = { latitude: 12.9716, longitude: 77.5946 };
const BENGALURU_SANITY_RADIUS_METERS = 140_000;
const MINIMUM_PLAUSIBLE_RATIO = 0.8;

export interface MoovitVerificationInput extends TransitProviderSnapshot {
  agencyId: string | null;
}

export interface BengaluruPlausibility {
  plausible: boolean;
  clearlyWrongRegion: boolean;
  insideRatio: number;
}

export function checkBengaluruVehiclePlausibility(vehicles: TransitVehicle[]): BengaluruPlausibility {
  const sample = vehicles.slice(0, 200);
  if (sample.length === 0) return { plausible: false, clearlyWrongRegion: false, insideRatio: 0 };
  const inside = sample.filter((vehicle) => haversineDistanceMeters(
    vehicle.latitude,
    vehicle.longitude,
    BENGALURU_CENTER.latitude,
    BENGALURU_CENTER.longitude,
  ) <= BENGALURU_SANITY_RADIUS_METERS).length;
  const insideRatio = inside / sample.length;
  return {
    plausible: insideRatio >= MINIMUM_PLAUSIBLE_RATIO,
    clearlyWrongRegion: insideRatio < 0.5,
    insideRatio,
  };
}

function isBmtcAgency(route: TransitRoute): boolean {
  return /\bBMTC\b|bengal(?:uru|ore)\s+metropolitan\s+transport/i.test(route.agencyName ?? '');
}

export function verifyMoovitBengaluruFeed(input: MoovitVerificationInput): TransitProviderVerification {
  const freshVehicles = input.vehicles.filter((vehicle) => vehicle.isLive);
  if (freshVehicles.length === 0) {
    return {
      status: 'FAILED',
      reason: 'Moovit returned no fresh vehicle positions',
      bengaluruPlausible: null,
      routeMatchCount: 0,
      freshVehicleCount: 0,
    };
  }

  const routesById = new Map(input.routes.map((route) => [route.routeId, route]));
  const matchedRoutes = [...new Map(freshVehicles.flatMap((vehicle) => {
    const route = routesById.get(vehicle.routeId);
    return route ? [[route.routeId, route] as const] : [];
  })).values()];
  if (input.routes.length === 0 || matchedRoutes.length === 0) {
    return {
      status: 'FAILED',
      reason: 'Moovit real-time route IDs do not match the configured GTFS static data',
      bengaluruPlausible: null,
      routeMatchCount: 0,
      freshVehicleCount: freshVehicles.length,
    };
  }

  const geography = checkBengaluruVehiclePlausibility(freshVehicles);
  if (geography.clearlyWrongRegion) {
    return {
      status: 'FAILED',
      reason: 'Moovit vehicle coordinates are outside the broad Bengaluru sanity region',
      bengaluruPlausible: false,
      routeMatchCount: matchedRoutes.length,
      freshVehicleCount: freshVehicles.length,
    };
  }
  if (!geography.plausible) {
    return {
      status: 'UNVERIFIED',
      reason: 'Only part of the Moovit vehicle sample is geographically plausible for Bengaluru',
      bengaluruPlausible: false,
      routeMatchCount: matchedRoutes.length,
      freshVehicleCount: freshVehicles.length,
    };
  }

  if (!input.agencyId) {
    return {
      status: 'UNVERIFIED',
      reason: 'Fresh Bengaluru-area bus data was returned, but no account-provided BMTC agency ID is configured',
      bengaluruPlausible: true,
      routeMatchCount: matchedRoutes.length,
      freshVehicleCount: freshVehicles.length,
    };
  }

  const routesWithAgencyMetadata = matchedRoutes.filter((route) => route.agencyId);
  const matchingAgencyRoutes = matchedRoutes.filter((route) => route.agencyId === input.agencyId);
  if (routesWithAgencyMetadata.length > 0 && matchingAgencyRoutes.length === 0) {
    return {
      status: 'FAILED',
      reason: 'Configured Moovit agency ID does not match the compatible GTFS static route metadata',
      bengaluruPlausible: true,
      routeMatchCount: matchedRoutes.length,
      freshVehicleCount: freshVehicles.length,
    };
  }
  if (matchingAgencyRoutes.length === 0 || !matchingAgencyRoutes.some(isBmtcAgency)) {
    return {
      status: 'UNVERIFIED',
      reason: 'Fresh Bengaluru-area data was returned, but BMTC agency identity is not confirmed by GTFS metadata',
      bengaluruPlausible: true,
      routeMatchCount: matchedRoutes.length,
      freshVehicleCount: freshVehicles.length,
    };
  }

  return {
    status: 'VERIFIED',
    reason: 'Fresh bus data, Bengaluru geography, route IDs, and configured BMTC agency metadata all match',
    bengaluruPlausible: true,
    routeMatchCount: matchedRoutes.length,
    freshVehicleCount: freshVehicles.length,
  };
}
