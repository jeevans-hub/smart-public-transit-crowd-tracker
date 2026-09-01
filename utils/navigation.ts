import type { AppRole } from './accessPolicy.ts';

export interface AppNavigationItem {
  href: string;
  label: string;
  description: string;
  privileged?: boolean;
}

const passengerNavigation: AppNavigationItem[] = [
  { href: '/dashboard', label: 'Dashboard', description: 'Version 1.0 overview' },
  { href: '/dashboard/bmtc', label: 'BMTC Tracking', description: 'Routes, buses, and crowd status' },
  { href: '/dashboard/bmtc/nearby', label: 'Nearby Stops', description: 'Arrivals and smart recommendations' },
  { href: '/dashboard/bmtc/forecasts', label: 'Crowd Forecasts', description: 'Route crowd estimates and confidence' },
  { href: '/dashboard/tickets', label: 'Digital Tickets', description: 'Generate a secure QR ticket' },
  { href: '/dashboard/tickets/history', label: 'Ticket History', description: 'View your previous tickets' },
];

const adminNavigation: AppNavigationItem[] = [
  { href: '/dashboard/tickets/validate', label: 'Ticket Validation', description: 'Staff boarding validation', privileged: true },
  { href: '/dashboard/bmtc/diagnostics', label: 'Provider Diagnostics', description: 'Feed readiness and health', privileged: true },
];

export function getNavigationForRole(role?: AppRole): AppNavigationItem[] {
  return role === 'admin' ? [...passengerNavigation, ...adminNavigation] : [...passengerNavigation];
}
