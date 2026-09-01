import { NextRequest, NextResponse } from 'next/server';
import { bmtcIngestionService } from '@/services/transit/bmtcIngestionService';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';
import { normalizeTransitFeedHealth } from '@/utils/providerStatus';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication is required' },
    }, { status: 401 });
  }
  try {
    return NextResponse.json({ success: true, data: normalizeTransitFeedHealth(bmtcIngestionService.getProviderStatus()) });
  } catch {
    return NextResponse.json({
      success: false,
      error: { code: 'PROVIDER_STATUS_UNAVAILABLE', message: 'Provider status is temporarily unavailable' },
    }, { status: 503 });
  }
}
