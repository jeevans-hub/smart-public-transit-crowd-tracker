import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBmtcCrowdPredictions } from '@/services/transit/recommendationService';
import { socketServer } from '@/server/socket';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

const querySchema = z.object({
  route: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  stopId: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9:_-]+$/).optional(),
  hour: z.coerce.number().int().min(0).max(23).optional(),
  weekday: z.coerce.number().int().min(0).max(6).optional(),
});

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  }
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_PREDICTION_QUERY', message: parsed.error.issues[0]?.message || 'Invalid prediction query' } }, { status: 400 });
  }

  const predictions = await getBmtcCrowdPredictions({
    routeNumber: parsed.data.route,
    stopId: parsed.data.stopId,
    hour: parsed.data.hour,
    weekday: parsed.data.weekday,
  });
  if (socketServer.isActive()) {
    socketServer.broadcastBmtcCrowdUpdate({ predictions, generatedAt: new Date().toISOString() });
  }
  return NextResponse.json({ success: true, data: predictions, dataSource: predictions[0]?.dataSource || 'DEMO' });
}
