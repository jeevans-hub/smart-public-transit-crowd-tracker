import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { getBmtcData, arrivalsForStop } from '@/services/transit/bmtcService';

export async function GET(request: NextRequest, context: { params: Promise<{ stopId: string }> }) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const { stopId } = await context.params;
  const data = await getBmtcData();
  const stop = data.stops.find(item => item.stopId === stopId);
  if (!stop) return NextResponse.json({ success: false, error: { code: 'STOP_NOT_FOUND', message: 'BMTC stop not found' } }, { status: 404 });
  const destinations = data.routes.filter(route => route.stopIds.includes(stopId)).flatMap(route => route.stopIds.filter(id => id !== stopId)).map(destinationId => data.stops.find(item => item.stopId === destinationId)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const uniqueDestinations = [...new Map(destinations.map(item => [item.stopId, item])).values()];
  return NextResponse.json({ success: true, data: { stop, arrivals: arrivalsForStop(stop, data.routes, data.vehicles, data.tripUpdates), destinations: uniqueDestinations }, dataSource: data.dataSource });
}
