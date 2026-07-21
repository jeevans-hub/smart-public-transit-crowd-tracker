import { NextRequest, NextResponse } from 'next/server';
import { agencyService } from '../../../../services/agencyService';
import { UpdateAgencyDTO } from '../../../../types/agency';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agency = await agencyService.getById(id);
    if (!agency) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: agency });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch agency' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateAgencyDTO = await request.json();
    const agency = await agencyService.update(id, body);
    return NextResponse.json({ success: true, data: agency });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update agency' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await agencyService.delete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Agency not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: 'Agency deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete agency' },
      { status: 500 }
    );
  }
}
