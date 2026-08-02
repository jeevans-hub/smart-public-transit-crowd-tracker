import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/control-centers
 * Get all control centers
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');

    if (cityId) {
      const centers = await digitalTwinService.getControlCentersByCity(cityId);
      return NextResponse.json({ success: true, data: centers });
    }

    const centers = await digitalTwinService.getAllControlCenters();
    return NextResponse.json({ success: true, data: centers });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch control centers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/control-centers
 * Create a new control center
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const center = await digitalTwinService.createControlCenter(body);
    return NextResponse.json({ success: true, data: center }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create control center' },
      { status: 400 }
    );
  }
}
