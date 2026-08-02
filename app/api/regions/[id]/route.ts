import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/regions/[id]
 * Get region by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const region = await digitalTwinService.getRegionById(id);
    if (!region) {
      return NextResponse.json({ success: false, error: 'Region not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: region });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch region' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/regions/[id]
 * Update region
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const region = await digitalTwinService.updateRegion(id, body);
    return NextResponse.json({ success: true, data: region });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update region' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/regions/[id]
 * Delete region
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await digitalTwinService.deleteRegion(id);
    return NextResponse.json({ success: true, data: { deleted: success } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete region' },
      { status: 500 }
    );
  }
}
