import { NextRequest, NextResponse } from 'next/server';
import { bmtcIngestionService } from '@/services/transit/bmtcIngestionService';
import { calculateCrowdValidation } from '@/services/transit/qualityValidationService';
import { calculateEtaValidationMetrics } from '@/services/transit/etaValidationService';
import { providerReliabilityService } from '@/services/transit/providerReliabilityService';
import { normalizeTransitFeedHealth } from '@/utils/providerStatus';
import { authorizeRequest, PROVIDER_DIAGNOSTIC_ROLES } from '@/utils/authorization';

export async function GET(request: NextRequest) {
  const access = await authorizeRequest(request, PROVIDER_DIAGNOSTIC_ROLES);
  if (!access.authenticated) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication is required' } }, { status: 401 });
  }
  if (!access.authorized) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Administrator access is required' } }, { status: 403 });
  const health = normalizeTransitFeedHealth(bmtcIngestionService.getProviderStatus());
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
