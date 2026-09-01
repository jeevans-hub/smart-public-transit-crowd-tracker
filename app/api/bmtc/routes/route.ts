import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { getBmtcData } from '@/services/transit/bmtcService';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const search = request.nextUrl.searchParams.get('search')?.trim().toLowerCase() || '';
  const { routes, dataSource } = await getBmtcData();
  const filtered = search ? routes.filter(route => [route.routeNumber, route.origin, route.destination, route.longName].some(value => value.toLowerCase().includes(search))) : routes;
  return NextResponse.json({ success: true, data: filtered, dataSource });
}
