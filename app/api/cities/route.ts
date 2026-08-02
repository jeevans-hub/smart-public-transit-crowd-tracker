import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/cities
 * Get all cities
 */
export async function GET() {
  try {
    const cities = await digitalTwinService.getAllCities();
    return NextResponse.json({ success: true, data: cities });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cities
 * Create a new city
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const city = await digitalTwinService.createCity(body);
    return NextResponse.json({ success: true, data: city }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create city' },
      { status: 400 }
    );
  }
}
