import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { getBmtcData, nearbyStops } from '@/services/transit/bmtcService';

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().int().min(1).max(5000).default(1500),
});

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'INVALID_LOCATION', message: parsed.error.issues[0]?.message || 'Invalid location' } }, { status: 400 });
  const { stops, dataSource } = await getBmtcData();
  return NextResponse.json({ success: true, data: nearbyStops(stops, parsed.data.lat, parsed.data.lng, parsed.data.radius), dataSource });
}
