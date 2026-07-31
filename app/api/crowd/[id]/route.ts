import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getCrowdReportById, deleteCrowdReport, toCrowdReportResponse, getCrowdStatistics } from '@/services/crowdService';
import { verifyToken } from '@/utils/helpers';
import { socketServer } from '@/server/socket';
import { SERVER_EVENTS } from '@/utils/eventNames';

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
    
    const deletedResponse = toCrowdReportResponse(deleted);
    
    // Emit socket events after successful database operation
    if (socketServer.isActive()) {
      // Emit crowd:deleted
      socketServer.broadcast(SERVER_EVENTS.CROWD_DELETED, { id: deletedResponse._id });
      
      // Emit dashboard:update
      const statistics = await getCrowdStatistics();
      socketServer.broadcast(SERVER_EVENTS.DASHBOARD_UPDATE, statistics);
      
      // Emit timeline:update
      socketServer.broadcast(SERVER_EVENTS.TIMELINE_UPDATE, {
        type: 'CROWD_REPORT_DELETED',
        data: deletedResponse,
        timestamp: new Date(),
      });
    }
    
    return NextResponse.json({ success: true, message: 'Crowd report deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete crowd report' },
      { status: 500 }
    );
  }
}
