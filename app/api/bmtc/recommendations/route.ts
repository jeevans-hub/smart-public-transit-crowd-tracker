import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBmtcRecommendation } from '@/services/transit/recommendationService';
import { evaluateUserBmtcAlerts } from '@/services/transit/bmtcAlertService';
import { socketServer } from '@/server/socket';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

const stopIdSchema = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9:_-]+$/, 'Invalid stop ID');
const querySchema = z.object({
  stopId: stopIdSchema,
  destinationStopId: stopIdSchema,
  route: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  maxWaitMinutes: z.coerce.number().int().min(1).max(120).default(30),
}).refine((value) => value.stopId !== value.destinationStopId, {
  message: 'Boarding stop and destination must be different',
  path: ['destinationStopId'],
});

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  }

  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_RECOMMENDATION_QUERY', message: parsed.error.issues[0]?.message || 'Invalid recommendation query' } }, { status: 400 });
  }

  const recommendation = await getBmtcRecommendation({
    stopId: parsed.data.stopId,
    destinationStopId: parsed.data.destinationStopId,
    routeNumber: parsed.data.route,
    maxWaitMinutes: parsed.data.maxWaitMinutes,
  });
  if (!recommendation) {
    return NextResponse.json({ success: false, error: { code: 'STOP_NOT_FOUND', message: 'Boarding stop or destination was not found' } }, { status: 404 });
  }

  if (socketServer.isActive()) {
    socketServer.broadcastBmtcRecommendationUpdate(recommendation);
    socketServer.broadcastBmtcRushUpdate(recommendation.rush);
  }
  await evaluateUserBmtcAlerts(user.userId, recommendation);

  return NextResponse.json({ success: true, data: recommendation, dataSource: recommendation.dataSource });
}
