import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCrowdReportById, deleteCrowdReport, toCrowdReportResponse } from '@/services/crowdService';
import { verifyToken } from '@/utils/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const report = await getCrowdReportById(id);
    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Crowd report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: toCrowdReportResponse(report) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch crowd report' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    await connectDB();
    const { id } = await params;
    
    const deleted = await deleteCrowdReport(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Crowd report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'Crowd report deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete crowd report' },
      { status: 500 }
    );
  }
}
