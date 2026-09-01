import { NextRequest, NextResponse } from 'next/server';
import { bmtcIngestionService } from '@/services/transit/bmtcIngestionService';
import { calculateCrowdValidation } from '@/services/transit/qualityValidationService';
import { calculateEtaValidationMetrics } from '@/services/transit/etaValidationService';
import { providerReliabilityService } from '@/services/transit/providerReliabilityService';
import { COOKIE_CONFIG } from '@/utils/constants';
import { verifyToken } from '@/utils/helpers';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  }
  const health = bmtcIngestionService.getProviderStatus();
  return NextResponse.json({
    success: true,
    data: {
      health,
      reliability: providerReliabilityService.getSnapshot(),
      etaValidation: calculateEtaValidationMetrics([]),
      crowdValidation: calculateCrowdValidation([], false),
      recommendationValidation: { sampleCount: 0, status: 'No real-world recommendation outcomes recorded' },
      credentialsExposed: false,
    },
  });
}
