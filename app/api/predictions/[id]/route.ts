import { NextRequest, NextResponse } from 'next/server';
import {
  getPredictionById,
  deletePrediction,
  toPredictionResponse,
  getStationPredictionMetrics,
} from '@/services/predictionService';

/**
 * GET /api/predictions/:id
 * Get a specific prediction by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = await getPredictionById(id);

    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prediction not found',
        },
        { status: 404 }
      );
    }

    const metrics = await getStationPredictionMetrics(prediction.stationId);

    return NextResponse.json({
      success: true,
      data: {
        prediction: toPredictionResponse(prediction),
        metrics,
      },
    });
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch prediction',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predictions/:id
 * Delete a specific prediction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prediction = await deletePrediction(id);

    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prediction not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: toPredictionResponse(prediction),
    });
  } catch (error) {
    console.error('Error deleting prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete prediction',
      },
      { status: 500 }
    );
  }
}
