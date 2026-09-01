import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { getBmtcData, arrivalsForStop } from '@/services/transit/bmtcService';

export async function GET(request: NextRequest, context: { params: Promise<{ vehicleId: string }> }) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const { vehicleId } = await context.params;
  const data = await getBmtcData();
  const vehicle = data.vehicles.find(item => item.vehicleId === vehicleId);
  if (!vehicle) return NextResponse.json({ success: false, error: { code: 'VEHICLE_NOT_FOUND', message: 'BMTC vehicle not found' } }, { status: 404 });
  const route = data.routes.find(item => item.routeId === vehicle.routeId) || null;
  const currentStop = data.stops.find(item => item.stopId === vehicle.currentStopId) || null;
  const nextStop = data.stops.find(item => item.stopId === vehicle.nextStopId) || null;
  const eta = nextStop ? arrivalsForStop(nextStop, data.routes, [vehicle], data.tripUpdates)[0] || null : null;
  return NextResponse.json({ success: true, data: { vehicle, route, currentStop, nextStop, eta }, dataSource: data.dataSource });
}
