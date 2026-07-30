import { NextResponse } from 'next/server';
import { getCriticalPredictions, toPredictionResponse } from '@/services/predictionService';

/**
 * GET /api/predictions/critical
 * Get critical predictions requiring immediate attention
 */
export async function GET() {
  try {
    const criticalPredictions = await getCriticalPredictions();

    return NextResponse.json({
      success: true,
      data: criticalPredictions.map(toPredictionResponse),
    });
  } catch (error) {
    console.error('Error fetching critical predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch critical predictions',
      },
      { status: 500 }
    );
  }
}
