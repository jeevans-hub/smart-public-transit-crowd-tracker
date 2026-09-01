import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { getBmtcData } from '@/services/transit/bmtcService';

const filtersSchema = z.object({ route: z.string().trim().max(30).optional(), stopId: z.string().trim().max(100).optional(), area: z.string().trim().max(100).optional(), crowdLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional(), includeStale: z.enum(['true', 'false']).transform((value) => value === 'true').optional() });

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const parsed = filtersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'INVALID_FILTER', message: parsed.error.issues[0]?.message || 'Invalid filter' } }, { status: 400 });
  const { routes, stops, vehicles, dataSource } = await getBmtcData({ includeStale: parsed.data.includeStale });
  const routeMap = new Map(routes.map(route => [route.routeId, route]));
  const stopMap = new Map(stops.map(stop => [stop.stopId, stop]));
  const filtered = vehicles.filter(vehicle => {
    const route = routeMap.get(vehicle.routeId);
    const currentStop = vehicle.currentStopId ? stopMap.get(vehicle.currentStopId) : undefined;
    return (!parsed.data.route || route?.routeNumber.toLowerCase().includes(parsed.data.route.toLowerCase())) && (!parsed.data.stopId || vehicle.currentStopId === parsed.data.stopId || vehicle.nextStopId === parsed.data.stopId) && (!parsed.data.area || currentStop?.area.toLowerCase().includes(parsed.data.area.toLowerCase())) && (!parsed.data.crowdLevel || vehicle.occupancy.crowdLevel === parsed.data.crowdLevel);
  });
  return NextResponse.json({ success: true, data: filtered.map(vehicle => ({ ...vehicle, route: routeMap.get(vehicle.routeId) || null })), dataSource });
}
