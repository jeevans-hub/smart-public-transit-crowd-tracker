import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/cities/[id]
 * Get city by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const city = await digitalTwinService.getCityById(id);
    if (!city) {
      return NextResponse.json({ success: false, error: 'City not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: city });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch city' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cities/[id]
 * Update city
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const city = await digitalTwinService.updateCity(id, body);
    return NextResponse.json({ success: true, data: city });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update city' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/cities/[id]
 * Delete city
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await digitalTwinService.deleteCity(id);
    return NextResponse.json({ success: true, data: { deleted: success } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete city' },
      { status: 500 }
    );
  }
}
