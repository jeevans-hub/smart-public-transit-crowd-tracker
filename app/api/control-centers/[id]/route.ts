import { NextRequest, NextResponse } from 'next/server';
import { digitalTwinService } from '@/services/digitalTwinService';

/**
 * GET /api/control-centers/[id]
 * Get control center by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const center = await digitalTwinService.getControlCenterById(id);
    if (!center) {
      return NextResponse.json({ success: false, error: 'Control center not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: center });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch control center' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/control-centers/[id]
 * Update control center
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const center = await digitalTwinService.updateControlCenter(id, body);
    return NextResponse.json({ success: true, data: center });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update control center' },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/control-centers/[id]
 * Delete control center
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await digitalTwinService.deleteControlCenter(id);
    return NextResponse.json({ success: true, data: { deleted: success } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete control center' },
      { status: 500 }
    );
  }
}
