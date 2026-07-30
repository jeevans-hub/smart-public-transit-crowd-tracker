import { NextRequest, NextResponse } from 'next/server';
import {
  createPrediction,
  getPredictions,
  deleteOldPredictions,
  calculatePredictionMetrics,
  getPredictionStatistics,
  toPredictionResponse,
  getCriticalPredictions,
} from '@/services/predictionService';

/**
 * GET /api/predictions
 * Get predictions with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const station = searchParams.get('station');
    const window = searchParams.get('window') as '15' | '30' | '60' | null;
    const risk = searchParams.get('risk');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const critical = searchParams.get('critical') === 'true';

    if (critical) {
      const criticalPredictions = await getCriticalPredictions();
      return NextResponse.json({
        success: true,
        data: criticalPredictions.map(toPredictionResponse),
      });
    }

    const filters: any = {};
    if (station) filters.stationId = station;
    if (window) filters.window = window;
    if (risk) filters.risk = risk;
    filters.limit = limit;
    filters.page = page;

    const { predictions, total } = await getPredictions(filters);
    const metrics = await calculatePredictionMetrics();
    const statistics = await getPredictionStatistics();

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictions.map(toPredictionResponse),
        total,
        metrics,
        statistics,
      },
    });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch predictions',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/predictions
 * Generate a new prediction
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { stationId, stationName, window } = body;

    if (!stationId || !stationName || !window) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: stationId, stationName, window',
        },
        { status: 400 }
      );
    }

    if (!['15', '30', '60'].includes(window)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid window. Must be 15, 30, or 60',
        },
        { status: 400 }
      );
    }

    const prediction = await createPrediction({
      stationId,
      stationName,
      window,
    });

    return NextResponse.json({
      success: true,
      data: toPredictionResponse(prediction),
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create prediction',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictions
 * Delete old predictions (cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const daysOld = parseInt(searchParams.get('daysOld') || '30');

    const deletedCount = await deleteOldPredictions(daysOld);

    return NextResponse.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    console.error('Error deleting old predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete old predictions',
      },
      { status: 500 }
    );
  }
}
