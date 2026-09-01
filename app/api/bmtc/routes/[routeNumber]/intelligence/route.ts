import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBmtcData } from '@/services/transit/bmtcService';
import { getBmtcCrowdPredictions, getBmtcRouteCrowdPattern } from '@/services/transit/recommendationService';
import { findBestTravelWindow } from '@/utils/bestTravelTime';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

const routeSchema = z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/);

export async function GET(request: NextRequest, context: { params: Promise<{ routeNumber: string }> }) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const parsed = routeSchema.safeParse((await context.params).routeNumber);
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'INVALID_ROUTE', message: 'Invalid route number' } }, { status: 400 });

  const data = await getBmtcData();
  const route = data.routes.find((item) => item.routeNumber.toLowerCase() === parsed.data.toLowerCase());
  if (!route) return NextResponse.json({ success: false, error: { code: 'ROUTE_NOT_FOUND', message: 'BMTC route not found' } }, { status: 404 });
  const [predictions, trend] = await Promise.all([getBmtcCrowdPredictions({ routeNumber: route.routeNumber }), getBmtcRouteCrowdPattern(route.routeNumber)]);
  const vehicles = data.vehicles.filter((item) => item.routeId === route.routeId);
  return NextResponse.json({ success: true, data: { route, currentPrediction: predictions[0] || null, trend: trend || [], bestTravelWindow: findBestTravelWindow(trend || []), activeVehicles: vehicles, averageDelayMinutes: 0 }, dataSource: data.dataSource });
}
