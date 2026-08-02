import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/regions
 * Get all regions
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');

    if (cityId) {
      const regions = await digitalTwinService.getRegionsByCity(cityId);
      return NextResponse.json({ success: true, data: regions });
    }

    const regions = await digitalTwinService.getAllRegions();
    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch regions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/regions
 * Create a new region
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const region = await digitalTwinService.createRegion(body);
    return NextResponse.json({ success: true, data: region }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create region' },
      { status: 400 }
    );
  }
}
