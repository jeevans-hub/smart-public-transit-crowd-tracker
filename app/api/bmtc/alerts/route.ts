import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createBmtcAlert, listBmtcAlerts } from '@/services/transit/bmtcAlertService';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

const idSchema = z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9:_-]+$/);
const alertSchema = z.object({
  routeNumber: z.string().trim().min(1).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  stopId: idSchema,
  destinationStopId: idSchema.optional(),
  threshold: z.enum(['HIGH', 'VERY_HIGH']),
  arrivalWithinMinutes: z.number().int().min(1).max(120).optional(),
  onlyIfBetterAlternative: z.boolean().default(false),
  enabled: z.boolean().default(true),
});

function authenticatedUser(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  return token ? verifyToken(token) : null;
}

export async function GET(request: NextRequest) {
  const user = authenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  try {
    return NextResponse.json({ success: true, data: await listBmtcAlerts(user.userId) });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'ALERT_STORAGE_UNAVAILABLE', message: 'Unable to load BMTC alerts' } }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const user = authenticatedUser(request);
  if (!user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  const parsed = alertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: { code: 'INVALID_ALERT', message: parsed.error.issues[0]?.message || 'Invalid alert settings' } }, { status: 400 });
  try {
    const alert = await createBmtcAlert(user.userId, parsed.data);
    return NextResponse.json({ success: true, data: alert }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'ALERT_STORAGE_UNAVAILABLE', message: 'Unable to save BMTC alert' } }, { status: 503 });
  }
}
